
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function repairUserTenant() {
    console.log('--- Repairing User-Tenant Association ---');

    const email = 'admin@demo.com'; // Change this to the email being used in production

    // 1. Find the first tenant
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
        console.error('No tenants found in database. Create a tenant first.');
        return;
    }
    console.log(`Found tenant: ${tenant.name} (${tenant.id})`);

    // 2. Update the user
    try {
        const user = await prisma.user.update({
            where: { email },
            data: { tenantId: tenant.id }
        });
        console.log(`✅ Success! User ${user.email} is now associated with tenant ${tenant.name}.`);
    } catch (error) {
        console.error(`❌ Error updating user: ${email}. Does the user exist?`);
        console.error(error);
    }
}

repairUserTenant()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
