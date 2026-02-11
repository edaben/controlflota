import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const routes = await prisma.route.findMany({
        include: {
            stops: true
        },
        take: 2
    });

    console.log('--- API SIMULATION: ROUTES ---');
    routes.forEach(route => {
        console.log(`Route: ${route.name}`);
        route.stops.forEach(stop => {
            console.log(`  Stop: ${stop.name} | Type: ${stop.geofenceType}`);
            if (stop.geofenceType === 'polygon') {
                console.log(`    Coords Count: ${Array.isArray(stop.geofenceCoordinates) ? stop.geofenceCoordinates.length : 'NOT_ARRAY'}`);
                console.log(`    Coords 1: ${JSON.stringify(Array.isArray(stop.geofenceCoordinates) ? stop.geofenceCoordinates[0] : null)}`);
            }
        });
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
