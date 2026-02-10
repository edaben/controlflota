import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { comparePassword, generateToken } from '../utils/auth';

const router = Router();
const prisma = new PrismaClient();

router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { tenant: true }
        });

        if (!user || !(await comparePassword(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.active) {
            return res.status(401).json({ error: 'User account is disabled' });
        }

        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId
        });

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                tenantId: user.tenantId,
                tenantName: user.tenant?.name
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
