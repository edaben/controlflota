import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { comparePassword, generateToken } from '../utils/auth';

const router = Router();
const prisma = new PrismaClient();

router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        console.log('🔐 Login attempt for:', email);

        const user = await prisma.user.findUnique({
            where: { email },
            include: { tenant: true }
        });

        console.log('👤 User found:', user ? 'YES' : 'NO');

        if (!user || !(await comparePassword(password, user.password))) {
            console.log('❌ Invalid credentials');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId
        });

        console.log('✅ Login successful for:', email);

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
        console.error('💥 Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
