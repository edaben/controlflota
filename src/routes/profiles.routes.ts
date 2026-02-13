import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authorize, authenticate, tenantMiddleware } from '../middleware/auth.middleware';
import { PERMISSIONS } from '../constants/permissions';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate, tenantMiddleware);

// Listar perfiles del tenant
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const profiles = await prisma.profile.findMany({
            where: { tenantId: req.user?.tenantId as string },
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { users: true }
                }
            }
        });
        res.json(profiles);
    } catch (error) {
        res.status(500).json({ error: 'Could not fetch profiles' });
    }
});

// Crear perfil
router.post('/', authorize([], [PERMISSIONS.MANAGE_USERS]), async (req: AuthRequest, res: Response) => {
    const { name, permissions } = req.body;
    try {
        const profile = await prisma.profile.create({
            data: {
                name,
                permissions: permissions || [],
                tenantId: req.user?.tenantId as string
            }
        });
        res.status(201).json(profile);
    } catch (error) {
        res.status(400).json({ error: 'Could not create profile' });
    }
});

// Actualizar perfil
router.put('/:id', authorize([], [PERMISSIONS.MANAGE_USERS]), async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name, permissions } = req.body;
    try {
        const profile = await prisma.profile.update({
            where: { id, tenantId: req.user?.tenantId as string },
            data: { name, permissions }
        });
        res.json(profile);
    } catch (error) {
        res.status(400).json({ error: 'Could not update profile' });
    }
});

// Eliminar perfil
router.delete('/:id', authorize([], [PERMISSIONS.MANAGE_USERS]), async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        // Verificar si hay usuarios usándolo
        const usersCount = await prisma.user.count({
            where: { profileId: id }
        });

        if (usersCount > 0) {
            return res.status(400).json({ error: 'No se puede eliminar un perfil que está siendo usado por usuarios' });
        }

        await prisma.profile.delete({
            where: { id, tenantId: req.user?.tenantId as string }
        });
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: 'Could not delete profile' });
    }
});

export default router;
