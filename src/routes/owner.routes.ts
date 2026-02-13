import { Router, Response, Request } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * Middleware para validar el token del propietario
 */
const validateOwner = async (req: Request, res: Response, next: any) => {
    const { token } = req.params;
    if (!token) return res.status(401).json({ error: 'Token is required' });

    const vehicle = await prisma.vehicle.findUnique({
        where: { ownerToken: token },
        include: { tenant: true }
    });

    if (!vehicle) return res.status(404).json({ error: 'Invalid or expired token' });

    // Inyectar el vehículo en el request para uso posterior
    (req as any).ownerVehicle = vehicle;
    next();
};

/**
 * Obtener resumen del vehículo para el dueño
 */
router.get('/:token/summary', validateOwner, async (req: Request, res: Response) => {
    const vehicle = (req as any).ownerVehicle;

    // Deuda total estimada (Sumar todas las multas no pagadas)
    const stats = await prisma.fine.aggregate({
        where: {
            infraction: { vehicleId: vehicle.id },
            status: { not: 'PAID' }
        },
        _sum: { amountUsd: true },
        _count: { id: true }
    });

    res.json({
        vehicle: {
            plate: vehicle.plate,
            internalCode: vehicle.internalCode,
            ownerName: vehicle.ownerName
        },
        tenant: {
            name: vehicle.tenant.name
        },
        stats: {
            pendingAmount: stats._sum.amountUsd || 0,
            pendingCount: stats._count.id || 0
        }
    });
});

/**
 * Obtener historial de infracciones recientes
 */
router.get('/:token/infractions', validateOwner, async (req: Request, res: Response) => {
    const vehicle = (req as any).ownerVehicle;
    const { limit = '10' } = req.query;

    const infractions = await prisma.infraction.findMany({
        where: { vehicleId: vehicle.id },
        orderBy: { detectedAt: 'desc' },
        take: parseInt(limit as string),
        include: {
            fine: true
        }
    });

    res.json(infractions);
});

export default router;
