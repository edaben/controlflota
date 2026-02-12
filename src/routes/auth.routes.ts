import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { comparePassword, generateToken } from '../utils/auth';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

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
            permissions: user.permissions,
            tenantId: user.tenantId
        });

        console.log('✅ Login successful for:', email);

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
                phone: user.phone,
                avatarUrl: user.avatarUrl,
                permissions: user.permissions,
                tenantId: user.tenantId,
                tenantName: user.tenant?.name
            }
        });
    } catch (error) {
        console.error('💥 Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        console.log('🔍 Fetching profile for user ID:', req.user?.id);
        const user = await prisma.user.findUnique({
            where: { id: req.user?.id },
            include: { tenant: { select: { name: true } } }
        });

        if (!user) {
            console.log('❌ User not found in DB');
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('✅ User found, sending data:', {
            email: user.email,
            name: user.name,
            role: user.role
        });

        res.json({
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            phone: user.phone,
            avatarUrl: user.avatarUrl,
            permissions: user.permissions,
            tenantId: user.tenantId,
            tenantName: user.tenant?.name
        });
    } catch (error) {
        console.error('💥 Error fetching profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/auth/profile
router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
    const { name, phone, avatarUrl } = req.body;
    console.log('📝 Updating profile for user:', req.user?.id, 'Data:', { name, phone });

    try {
        const user = await prisma.user.update({
            where: { id: req.user?.id },
            data: { name, phone, avatarUrl },
            include: { tenant: { select: { name: true } } } // Include tenant to return consistent data
        });

        console.log('✅ Profile updated successfully');

        res.json({
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            phone: user.phone,
            avatarUrl: user.avatarUrl,
            permissions: user.permissions,
            tenantId: user.tenantId,
            tenantName: user.tenant?.name
        });
    } catch (error) {
        console.error('💥 Error updating profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
