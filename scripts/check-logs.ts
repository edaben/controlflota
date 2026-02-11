
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkGpsEvents() {
    console.log('--- Checking Latest GPS Events (Raw Webhook Data) ---');

    const events = await prisma.gpsEvent.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            createdAt: true,
            deviceId: true,
            eventType: true,
            processedAt: true,
            tenant: { select: { name: true } }
        }
    });

    if (events.length === 0) {
        console.log('❌ No GPS Events found in database.');
    } else {
        console.table(events);
    }
}

checkGpsEvents()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
