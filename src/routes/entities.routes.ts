import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authorize, authenticate, tenantMiddleware } from '../middleware/auth.middleware';
import { PERMISSIONS } from '../constants/permissions';

const router = Router();
const prisma = new PrismaClient();

// Aplicar auth y tenant isolation a todas estas rutas
router.use(authenticate, tenantMiddleware);

// --- Vehículos ---
router.get('/vehicles', async (req: AuthRequest, res: Response) => {
    const vehicles = await prisma.vehicle.findMany({
        where: { tenantId: req.user?.tenantId as string }
    });
    // Frontend expects 'name', map it from 'internalCode'
    const response = vehicles.map(v => ({
        ...v,
        name: v.internalCode || v.plate
    }));
    res.json(response);
});

router.post('/vehicles', authorize([], [PERMISSIONS.MANAGE_VEHICLES]), async (req: AuthRequest, res: Response) => {
    const { plate, traccarDeviceId, internalCode } = req.body;
    try {
        const vehicle = await prisma.vehicle.create({
            data: {
                tenantId: req.user?.tenantId as string,
                plate,
                traccarDeviceId: traccarDeviceId ? parseInt(traccarDeviceId) : null,
                internalCode
            }
        });
        res.status(201).json(vehicle);
    } catch (error) {
        res.status(400).json({ error: 'Could not create vehicle' });
    }
});

router.put('/vehicles/:id', authorize([], [PERMISSIONS.MANAGE_VEHICLES]), async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { plate, traccarDeviceId, internalCode } = req.body;
    try {
        const vehicle = await prisma.vehicle.update({
            where: {
                id,
                tenantId: req.user?.tenantId as string
            },
            data: {
                plate,
                traccarDeviceId: traccarDeviceId ? parseInt(traccarDeviceId) : null,
                internalCode
            }
        });
        res.json(vehicle);
    } catch (error) {
        res.status(400).json({ error: 'Could not update vehicle' });
    }
});

router.delete('/vehicles/:id', authorize([], [PERMISSIONS.MANAGE_VEHICLES]), async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.vehicle.delete({
            where: {
                id,
                tenantId: req.user?.tenantId as string
            }
        });
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: 'Could not delete vehicle' });
    }
});

// --- Rutas ---
router.get('/routes', async (req: AuthRequest, res: Response) => {
    const routes = await prisma.route.findMany({
        where: { tenantId: req.user?.tenantId as string },
        include: { stops: { orderBy: { order: 'asc' } } }
    });
    res.json(routes);
});

router.post('/routes', authorize([], [PERMISSIONS.MANAGE_ROUTES]), async (req: AuthRequest, res: Response) => {
    const { name, code, description } = req.body;
    const route = await prisma.route.create({
        data: {
            tenantId: req.user?.tenantId as string,
            name,
            code,
            description
        }
    });
    res.status(201).json(route);
});

router.delete('/routes/:id', authorize([], [PERMISSIONS.MANAGE_ROUTES]), async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const tenantId = req.user?.tenantId as string;

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Delete associated Rules (SegmentRule, SpeedZone)
            await tx.segmentRule.deleteMany({ where: { tenantId, routeId: id } });
            await tx.speedZone.deleteMany({ where: { tenantId, routeId: id } });

            // 2. Find all Stops for this route to delete their dependencies
            const stops = await tx.stop.findMany({ where: { tenantId, routeId: id }, select: { id: true } });
            const stopIds = stops.map(s => s.id);

            if (stopIds.length > 0) {
                // Delete Stop dependencies
                await tx.stopRule.deleteMany({ where: { tenantId, stopId: { in: stopIds } } });
                await tx.stopArrival.deleteMany({ where: { tenantId, stopId: { in: stopIds } } });

                // Delete Stops
                await tx.stop.deleteMany({ where: { tenantId, routeId: id } });
            }

            // 3. Delete the Route
            await tx.route.delete({ where: { id, tenantId } });
        });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting route:', error);
        res.status(500).json({ error: 'Could not delete route. It might be referenced.' });
    }
});

// --- Users ---
router.get('/users', async (req: AuthRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            where: { tenantId: req.user?.tenantId as string },
            // include removed as it conflicts with select
            select: {
                id: true,
                email: true,
                role: true,
                permissions: true,
                tenantId: true,
                createdAt: true,
                updatedAt: true,
                tenant: { select: { name: true } }
            }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Could not fetch users' });
    }
});

router.post('/users', authorize([], [PERMISSIONS.MANAGE_USERS]), async (req: AuthRequest, res: Response) => {
    const { email, password, role, permissions } = req.body;
    console.log('[POST /users] Attempting to create user:', { email, role, tenantId: req.user?.tenantId });

    try {
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: role || 'CLIENT_USER',
                permissions: permissions || [],
                tenantId: req.user?.tenantId as string
            },
            select: {
                id: true,
                email: true,
                role: true,
                permissions: true,
                tenantId: true,
                createdAt: true,
                updatedAt: true
            }
        });
        console.log('[POST /users] User created successfully:', user.id);
        res.status(201).json(user);
    } catch (error: any) {
        console.error('[POST /users] Error creating user:', error);
        if (error.code === 'P2002') {
            res.status(400).json({ error: 'El email ya está registrado' });
        } else {
            res.status(400).json({ error: 'No se pudo crear el usuario', details: error.message });
        }
    }
});

router.put('/users/:id', authorize([], [PERMISSIONS.MANAGE_USERS]), async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { email, password, role, permissions } = req.body;
    try {
        const updateData: any = { email, role, permissions };

        if (password) {
            const bcrypt = require('bcrypt');
            updateData.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: {
                id,
                tenantId: req.user?.tenantId as string
            },
            data: updateData,
            select: {
                id: true,
                email: true,
                role: true,
                permissions: true,
                tenantId: true,
                createdAt: true,
                updatedAt: true
            }
        });
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: 'Could not update user' });
    }
});

router.delete('/users/:id', authorize([], [PERMISSIONS.MANAGE_USERS]), async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.user.delete({
            where: {
                id,
                tenantId: req.user?.tenantId as string
            }
        });
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: 'Could not delete user' });
    }
});

// --- Tenants (Solo para SUPER_ADMIN) ---
// Tenants endpoints already protected by specific checks, but authorize() is cleaner
router.get('/tenants', authorize(['SUPER_ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
        const tenants = await prisma.tenant.findMany({
            include: {
                _count: {
                    select: { users: true, vehicles: true }
                }
            }
        });
        res.json(tenants);
    } catch (error) {
        res.status(500).json({ error: 'Could not fetch tenants' });
    }
});

router.post('/tenants', authorize(['SUPER_ADMIN']), async (req: AuthRequest, res: Response) => {
    const { name, slug, apiKey } = req.body;
    try {
        const tenant = await prisma.tenant.create({
            data: {
                name,
                slug,
                apiKey: apiKey || `api-key-${Date.now()}`
            }
        });
        res.status(201).json(tenant);
    } catch (error: any) {
        if (error.code === 'P2002') {
            res.status(400).json({ error: 'Slug or API key already exists' });
        } else {
            res.status(400).json({ error: 'Could not create tenant' });
        }
    }
});

router.put('/tenants/:id', authorize(['SUPER_ADMIN']), async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name, slug, apiKey, active } = req.body;
    try {
        const tenant = await prisma.tenant.update({
            where: { id },
            data: { name, slug, apiKey, active }
        });
        res.json(tenant);
    } catch (error) {
        res.status(400).json({ error: 'Could not update tenant' });
    }
});

router.delete('/tenants/:id', authorize(['SUPER_ADMIN']), async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.tenant.delete({
            where: { id }
        });
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: 'Could not delete tenant' });
    }
});

// --- Infracciones ---
router.get('/infractions', async (req: AuthRequest, res: Response) => {
    try {
        const { vehicleId, status, dateFrom, dateTo } = req.query;
        const where: any = {
            tenantId: req.user?.tenantId as string
        };

        if (vehicleId) where.vehicleId = vehicleId as string;
        if (status) where.status = status as string;
        if (dateFrom || dateTo) {
            where.timestamp = {};
            if (dateFrom) where.timestamp.gte = new Date(dateFrom as string);
            if (dateTo) where.timestamp.lte = new Date(dateTo as string);
        }

        const infractions = await prisma.infraction.findMany({
            where,
            include: { vehicle: true },
            orderBy: { detectedAt: 'desc' }
        });
        res.json(infractions);
    } catch (error) {
        res.status(500).json({ error: 'Could not fetch infractions' });
    }
});

// --- Multas ---
router.get('/fines', async (req: AuthRequest, res: Response) => {
    try {
        const fines = await prisma.fine.findMany({
            where: { tenantId: req.user?.tenantId as string },
            include: {
                infraction: {
                    include: { vehicle: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(fines);
    } catch (error) {
        res.status(500).json({ error: 'Could not fetch fines' });
    }
});

// Envia recordatorios - Restricted
router.post('/fines/send-reminders', authorize([], [PERMISSIONS.MANAGE_FINES]), async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId as string;
        const pendingFines = await prisma.fine.findMany({
            where: {
                tenantId,
                status: 'PENDING'
            },
            include: {
                infraction: {
                    include: { vehicle: true }
                }
            }
        });

        if (pendingFines.length === 0) {
            return res.json({ message: 'No hay multas pendientes para notificar.' });
        }

        // Simular envío registrando en EmailLog
        await Promise.all(pendingFines.map((fine: any) =>
            prisma.emailLog.create({
                data: {
                    tenantId,
                    toEmail: 'cliente@example.com',
                    subject: `Recordatorio de Multa - ${fine.infraction.vehicle.plate}`,
                    status: 'SENT'
                }
            })
        ));

        res.json({ message: `Se han enviado ${pendingFines.length} recordatorios exitosamente.` });
    } catch (error) {
        res.status(500).json({ error: 'Error enviando recordatorios' });
    }
});

// --- Reglas (Rules) ---
// Segment Rules
router.get('/segment-rules', async (req: AuthRequest, res: Response) => {
    const rules = await prisma.segmentRule.findMany({
        where: { tenantId: req.user?.tenantId as string },
        include: { fromStop: true, toStop: true }
    });
    res.json(rules);
});

router.post('/segment-rules', authorize([], [PERMISSIONS.MANAGE_RULES]), async (req: AuthRequest, res: Response) => {
    try {
        const rule = await prisma.segmentRule.create({
            data: { ...req.body, tenantId: req.user?.tenantId as string }
        });
        res.status(201).json(rule);
    } catch (error) {
        res.status(400).json({ error: 'Could not create segment rule' });
    }
});

router.put('/segment-rules/:id', authorize([], [PERMISSIONS.MANAGE_RULES]), async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        const rule = await prisma.segmentRule.update({
            where: { id, tenantId: req.user?.tenantId as string },
            data: req.body
        });
        res.json(rule);
    } catch (error) {
        res.status(400).json({ error: 'Could not update segment rule' });
    }
});

router.delete('/segment-rules/:id', authorize([], [PERMISSIONS.MANAGE_RULES]), async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.segmentRule.delete({
            where: { id, tenantId: req.user?.tenantId as string }
        });
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: 'Could not delete segment rule' });
    }
});

// Stop Rules
router.get('/stop-rules', async (req: AuthRequest, res: Response) => {
    const rules = await prisma.stopRule.findMany({
        where: { tenantId: req.user?.tenantId as string },
        include: { stop: true }
    });
    res.json(rules);
});

router.post('/stop-rules', authorize([], [PERMISSIONS.MANAGE_RULES]), async (req: AuthRequest, res: Response) => {
    try {
        const rule = await prisma.stopRule.create({
            data: { ...req.body, tenantId: req.user?.tenantId as string }
        });
        res.status(201).json(rule);
    } catch (error) {
        res.status(400).json({ error: 'Could not create stop rule' });
    }
});

router.put('/stop-rules/:id', authorize(['SUPER_ADMIN', 'CLIENT_ADMIN']), async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        const rule = await prisma.stopRule.update({
            where: { id, tenantId: req.user?.tenantId as string },
            data: req.body
        });
        res.json(rule);
    } catch (error) {
        res.status(400).json({ error: 'Could not update stop rule' });
    }
});

router.delete('/stop-rules/:id', authorize(['SUPER_ADMIN', 'CLIENT_ADMIN']), async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.stopRule.delete({
            where: { id, tenantId: req.user?.tenantId as string }
        });
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: 'Could not delete stop rule' });
    }
});

// Speed Zones
router.get('/speed-zones', async (req: AuthRequest, res: Response) => {
    const zones = await prisma.speedZone.findMany({
        where: { tenantId: req.user?.tenantId as string }
    });
    res.json(zones);
});

router.post('/speed-zones', authorize([], [PERMISSIONS.MANAGE_RULES]), async (req: AuthRequest, res: Response) => {
    try {
        const zone = await prisma.speedZone.create({
            data: { ...req.body, tenantId: req.user?.tenantId as string }
        });
        res.status(201).json(zone);
    } catch (error) {
        res.status(400).json({ error: 'Could not create speed zone' });
    }
});

router.put('/speed-zones/:id', authorize(['SUPER_ADMIN', 'CLIENT_ADMIN']), async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        const zone = await prisma.speedZone.update({
            where: { id, tenantId: req.user?.tenantId as string },
            data: req.body
        });
        res.json(zone);
    } catch (error) {
        res.status(400).json({ error: 'Could not update speed zone' });
    }
});

router.delete('/speed-zones/:id', authorize(['SUPER_ADMIN', 'CLIENT_ADMIN']), async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.speedZone.delete({
            where: { id, tenantId: req.user?.tenantId as string }
        });
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: 'Could not delete speed zone' });
    }
});

// --- SMTP Configuration ---
router.get('/settings/smtp', async (req: AuthRequest, res: Response) => {
    try {
        const tenant = await prisma.tenant.findUnique({
            where: { id: req.user?.tenantId as string },
            select: {
                smtpHost: true,
                smtpPort: true,
                smtpUser: true,
                smtpFromEmail: true,
                smtpFromName: true,
                smtpSecure: true,
                // No devolvemos la contraseña por seguridad
            }
        });
        res.json(tenant || {});
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener configuración SMTP' });
    }
});

router.put('/settings/smtp', authorize([], [PERMISSIONS.MANAGE_SETTINGS]), async (req: AuthRequest, res: Response) => {
    try {
        const { smtpHost, smtpPort, smtpUser, smtpPassword, smtpFromEmail, smtpFromName, smtpSecure } = req.body;

        // Validación robusta de puerto
        let port = 587;
        if (smtpPort !== undefined && smtpPort !== null && smtpPort !== '') {
            const parsedPort = parseInt(smtpPort.toString());
            if (!isNaN(parsedPort)) {
                port = parsedPort;
            }
        }

        const updateData: any = {
            smtpHost: smtpHost || null,
            smtpPort: port,
            smtpUser: smtpUser || null,
            smtpFromEmail: smtpFromEmail || null,
            smtpFromName: smtpFromName || null,
            smtpSecure: !!smtpSecure
        };

        // Solo actualizar password si se proporciona explícitamente y no está vacío
        if (smtpPassword && smtpPassword.trim() !== '') {
            updateData.smtpPassword = smtpPassword;
        }

        const tenant = await prisma.tenant.update({
            where: { id: req.user?.tenantId as string },
            data: updateData,
            select: {
                smtpHost: true,
                smtpPort: true,
                smtpUser: true,
                smtpFromEmail: true,
                smtpFromName: true,
                smtpSecure: true,
            }
        });

        res.json(tenant);
    } catch (error: any) {
        console.error('CRITICAL: Error updating SMTP config:', error);
        res.status(500).json({
            error: 'Error al actualizar configuración SMTP',
            details: error.message || String(error)
        });
    }
});

router.post('/settings/smtp/test', authorize([], [PERMISSIONS.MANAGE_SETTINGS]), async (req: AuthRequest, res: Response) => {
    try {
        const { testEmail } = req.body;
        console.log('Testing SMTP for tenant:', req.user?.tenantId);

        if (!testEmail) {
            return res.status(400).json({ error: 'Email de prueba requerido' });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { id: req.user?.tenantId as string }
        });

        if (!tenant?.smtpHost || !tenant?.smtpUser || !tenant?.smtpPassword) {
            return res.status(400).json({
                error: 'Configuración SMTP incompleta',
                details: `Host: ${tenant?.smtpHost ? 'ok' : 'falta'}, User: ${tenant?.smtpUser ? 'ok' : 'falta'}, Pass: ${tenant?.smtpPassword ? 'ok' : 'falta'}`
            });
        }

        const nodemailer = require('nodemailer');

        // Configurar el transportista
        const transporter = nodemailer.createTransport({
            host: tenant.smtpHost,
            port: tenant.smtpPort || 587,
            secure: tenant.smtpSecure,
            auth: {
                user: tenant.smtpUser,
                pass: tenant.smtpPassword
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Enviar el correo
        await transporter.sendMail({
            from: `"${tenant.smtpFromName || 'Control Bus'}" <${tenant.smtpFromEmail || tenant.smtpUser}>`,
            to: testEmail,
            subject: "Prueba de Configuración SMTP - Control Bus",
            text: "Este es un correo de prueba para verificar que la configuración SMTP en Control Bus funciona correctamente.",
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #10b981;">Prueba de Configuración SMTP</h2>
                    <p>Este es un correo de prueba para verificar que la configuración SMTP en <b>Control Bus</b> funciona correctamente.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #666;">Enviado desde el panel de administración.</p>
                </div>
            `
        });

        res.json({
            success: true,
            message: `Correo de prueba enviado exitosamente a ${testEmail}`
        });
    } catch (error: any) {
        console.error('CRITICAL: Error sending test email:', error);
        res.status(500).json({
            error: 'Error al enviar correo de prueba',
            details: error.message || String(error)
        });
    }
});

export default router;
