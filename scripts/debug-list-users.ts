
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- Listing All Users ---');
        const users = await prisma.user.findMany({
            include: { tenant: true }
        });

        users.forEach(u => {
            console.log(`User: ${u.email} | Role: ${u.role} | Tenant: ${u.tenant?.name} (${u.tenantId})`);
        });

        console.log('\n--- Searching for eduardo@gmail.com ---');
        const specific = await prisma.user.findUnique({
            where: { email: 'eduardo@gmail.com' },
            include: { tenant: true }
        });

        if (specific) {
            console.log('FOUND:', specific);
        } else {
            console.log('NOT FOUND');
        }

    } catch (err) {
        console.error('Script error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
