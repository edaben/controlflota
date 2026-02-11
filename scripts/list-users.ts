
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
    console.log('Listing all users...');
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            role: true,
            tenant: {
                select: { name: true, slug: true }
            }
        }
    });

    console.log(JSON.stringify(users, null, 2));
}

listUsers()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
