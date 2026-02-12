
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function reset() {
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const user = await prisma.user.update({
            where: { email: 'eduardo@gmail.com' },
            data: { password: hashedPassword }
        });
        console.log('Password updated for:', user.email);
    } catch (e) {
        console.error('Error updating password:', e);
    } finally {
        await prisma.$disconnect();
    }
}

reset();
