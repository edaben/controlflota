
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetPassword() {
    const email = 'admin@controlbus.com';
    const newPassword = 'admin123';

    console.log(`Resetting password for ${email}...`);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
    });

    console.log(`✅ Password updated for user: ${user.email}`);
}

resetPassword()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
