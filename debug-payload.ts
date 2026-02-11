import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const counts = await prisma.stop.groupBy({
        by: ['geofenceType'],
        _count: {
            id: true
        }
    });

    console.log('--- STOPS GEOFENCE TYPE COUNTS ---');
    console.log(JSON.stringify(counts, null, 2));
    console.log('------------------------------');

    const polygonSample = await prisma.stop.findMany({
        where: { geofenceType: 'polygon' },
        take: 1
    });

    if (polygonSample.length > 0) {
        console.log('--- POLYGON SAMPLE ---');
        console.log(JSON.stringify(polygonSample[0], null, 2));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
