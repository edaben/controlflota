
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getApiKey() {
    console.log('Retrieving Tenant API Keys...');
    const tenants = await prisma.tenant.findMany({
        select: {
            name: true,
            slug: true,
            apiKey: true,
            active: true
        }
    });

    console.log(JSON.stringify(tenants, null, 2));
}

getApiKey()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
