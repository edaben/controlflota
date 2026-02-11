
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
    console.log('Checking for user admin@demo.com...');
    const user = await prisma.user.findUnique({
        where: { email: 'admin@demo.com' }
    });

    if (user) {
        console.log('User found:', user);
        console.log('Password hash:', user.password);
    } else {
        console.log('User NOT found.');

        // Check if ANY user exists
        const count = await prisma.user.count();
        console.log(`Total users in DB: ${count}`);
    }
}

checkUser()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
