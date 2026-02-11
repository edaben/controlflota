
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkVehicle() {
    console.log('Checking for Auto-Created Vehicles...');

    // Buscar vehículos recientes o por patrón de placa
    const vehicles = await prisma.vehicle.findMany({
        where: {
            plate: { startsWith: 'XYZ-' }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    if (vehicles.length > 0) {
        console.log('✅ Found Auto-Created Vehicles:');
        console.log(JSON.stringify(vehicles, null, 2));
    } else {
        console.log('❌ No vehicles found with plate starting with XYZ-');
    }
}

checkVehicle()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
