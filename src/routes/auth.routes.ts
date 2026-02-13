import { Router, Request, Response } from 'express';
import crypto from 'crypto';
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
            include: {
                tenant: true,
                profile: true
            }
        });

        console.log('👤 User found:', user ? 'YES' : 'NO');

        if (!user || !(await comparePassword(password, user.password))) {
            console.log('❌ Invalid credentials');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Merge manual permissions with profile permissions
        const effectivePermissions = Array.from(new Set([
            ...(user.permissions || []),
            ...(user.profile?.permissions || [])
        ]));

        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
            permissions: effectivePermissions,
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
                permissions: effectivePermissions,
                tenantId: user.tenantId,
                tenantName: user.tenant?.name,
                profileId: user.profileId,
                profileName: user.profile?.name
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
            include: {
                tenant: { select: { name: true } },
                profile: true
            }
        });

        if (!user) {
            console.log('❌ User not found in DB');
            return res.status(404).json({ error: 'User not found' });
        }

        const effectivePermissions = Array.from(new Set([
            ...(user.permissions || []),
            ...(user.profile?.permissions || [])
        ]));

        res.json({
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            phone: user.phone,
            avatarUrl: user.avatarUrl || `https://www.gravatar.com/avatar/${crypto.createHash('md5').update(user.email.toLowerCase().trim()).digest('hex')}?d=${encodeURIComponent(`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=random`)}`,
            permissions: effectivePermissions,
            tenantId: user.tenantId,
            tenantName: user.tenant?.name,
            profileId: user.profileId,
            profileName: user.profile?.name
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
            include: {
                tenant: { select: { name: true } },
                profile: true
            }
        });

        const effectivePermissions = Array.from(new Set([
            ...(user.permissions || []),
            ...(user.profile?.permissions || [])
        ]));

        res.json({
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            phone: user.phone,
            avatarUrl: user.avatarUrl || `https://www.gravatar.com/avatar/${crypto.createHash('md5').update(user.email.toLowerCase().trim()).digest('hex')}?d=${encodeURIComponent(`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=random`)}`,
            permissions: effectivePermissions,
            tenantId: user.tenantId,
            tenantName: user.tenant?.name,
            profileId: user.profileId,
            profileName: user.profile?.name
        });
    } catch (error) {
        console.error('💥 Error updating profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
