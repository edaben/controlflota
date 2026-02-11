
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

async function generateToken() {
    // Buscar usuario Super Admin
    const user = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' }
    });

    if (!user) {
        console.error('Super Admin not found');
        return;
    }

    const token = jwt.sign(
        { userId: user.id, role: user.role, tenantId: user.tenantId },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    console.log(token);
}

generateToken()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
