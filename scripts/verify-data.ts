
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyData() {
    console.log('--- Verifying Data Persistence ---');

    // 1. Check for the Vehicle
    const vehicle = await prisma.vehicle.findFirst({
        where: { plate: 'XAA1309' },
        include: { tenant: true }
    });
    console.log('\n1. Vehicle XAA1309:');
    if (vehicle) {
        console.log(`   ✅ Found! ID: ${vehicle.id}`);
        console.log(`   Tenant: ${vehicle.tenant.name} (${vehicle.tenantId})`);
    } else {
        console.log('   ❌ Not found.');
    }

    // 2. Check for the Stop
    const stop = await prisma.stop.findFirst({
        where: { name: { contains: 'Test Geofence Circle' } },
        include: { route: true, tenant: true }
    });
    console.log('\n2. Stop "Test Geofence Circle":');
    if (stop) {
        console.log(`   ✅ Found! ID: ${stop.id}`);
        console.log(`   Route: ${stop.route.name}`);
        console.log(`   Geofence Type: ${stop.geofenceType}`); // Nueva verificación
        console.log(`   Geofence Radius: ${stop.geofenceRadius}`); // Nueva verificación
        console.log(`   Coordinates: ${JSON.stringify(stop.geofenceCoordinates)}`);
    } else {
        console.log('   ❌ Not found.');
    }

    // 3. Check for recent GPS Events for System Admin
    const events = await prisma.gpsEvent.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { tenant: true }
    });
    console.log('\n3. Recent GPS Events:');
    events.forEach(e => {
        console.log(`   [${e.createdAt.toISOString()}] ${e.eventType} - Tenant: ${e.tenant.name}`);
    });
}

verifyData()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
