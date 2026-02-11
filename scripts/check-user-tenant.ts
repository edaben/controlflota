
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserTenant() {
    console.log('--- Checking User-Tenant Mapping ---');

    // 1. Get the Tenant ID where the vehicle is
    const targetTenantId = 'abdb9403-edce-4849-ad12-386a302a5d80'; // Obtained from previous verification
    console.log(`Target Tenant ID (where vehicle is): ${targetTenantId}`);

    // 2. Check the user 'admin@controlbus.com'
    const user = await prisma.user.findUnique({
        where: { email: 'admin@controlbus.com' },
        include: { tenant: true }
    });

    if (user) {
        console.log(`\nUser: ${user.email}`);
        console.log(`Role: ${user.role}`);
        console.log(`User's Tenant ID: ${user.tenantId}`);
        if (user.tenant) {
            console.log(`User's Tenant Name: ${user.tenant.name}`);
        }

        if (user.tenantId === targetTenantId) {
            console.log('\n✅ MATCH! User is in the correct tenant.');
        } else {
            console.log('\n❌ MISMATCH! User is in a different tenant.');
        }
    } else {
        console.log('User admin@controlbus.com not found.');
    }

    // 3. List all vehicles for this user's tenant
    if (user && user.tenantId) {
        const vehicles = await prisma.vehicle.findMany({
            where: { tenantId: user.tenantId }
        });
        console.log(`\nVehicles visible to this user (count: ${vehicles.length}):`);
        console.table(vehicles.map(v => ({ plate: v.plate, id: v.id })));
    }
}

checkUserTenant()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
