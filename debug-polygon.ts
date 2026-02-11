import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const polygons = await prisma.stop.findMany({
        where: { geofenceType: 'polygon' },
        take: 3
    });

    console.log('--- POLYGON STOPS RAW DATA ---');
    for (const stop of polygons) {
        console.log(`Stop: ${stop.name} (ID: ${stop.id})`);
        console.log(`  Stored Type: ${stop.geofenceType}`);
        console.log(`  Stored Coords: ${JSON.stringify(stop.geofenceCoordinates)}`);

        // Buscar el evento GPS relacionado si existe
        const event = await prisma.gpsEvent.findFirst({
            where: {
                eventType: { in: ['geofenceEnter', 'geofenceExit'] },
                rawPayload: {
                    path: ['geofence', 'id'],
                    equals: parseInt(stop.geofenceId || '0')
                }
            }
        });

        if (event) {
            console.log(`  Raw Area: ${(event.rawPayload as any)?.geofence?.area}`);
        } else {
            console.log(`  Raw Area: NOT FOUND IN LOGS`);
        }
        console.log('------------------------------');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
