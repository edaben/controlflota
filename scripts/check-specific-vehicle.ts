
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkVehicle(plate: string) {
    const vehicle = await prisma.vehicle.findFirst({
        where: { plate: plate }
    });

    if (vehicle) {
        console.log(`✅ Found Vehicle ${plate}:`);
        console.log(JSON.stringify(vehicle, null, 2));
    } else {
        console.log(`❌ No vehicle found with plate ${plate}`);

        // List all vehicles to see what's there
        const all = await prisma.vehicle.findMany({ take: 5 });
        console.log('Sample of existing vehicles:');
        console.log(JSON.stringify(all, null, 2));
    }
}

const plate = process.argv[2] || 'RAA5775';
checkVehicle(plate)
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
