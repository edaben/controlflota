import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
    console.log('--- Testing Segment Rule Creation ---');
    try {
        const tenant = await prisma.tenant.findFirst();
        const route = await prisma.route.findFirst();
        const stop1 = await prisma.stop.findFirst();
        const stop2 = await prisma.stop.findMany({ take: 1, skip: 1 });

        if (!tenant || !route || !stop1 || !stop2[0]) {
            console.error('Missing data for test');
            return;
        }

        console.log(`Using Tenant: ${tenant.id}, Route: ${route.id}`);

        const result = await prisma.segmentRule.create({
            data: {
                tenantId: tenant.id,
                routeId: route.id,
                fromStopId: stop1.id,
                toStopId: stop2[0].id,
                expectedMaxMinutes: 30,
                fineAmountUsd: 10.0,
                penaltyPerMinuteUsd: 1.0
            }
        });
        console.log('Success creating segment rule:', result.id);
        await prisma.segmentRule.delete({ where: { id: result.id } });
    } catch (e) {
        console.error('FAILED creating segment rule:', e);
    }

    console.log('\n--- Testing Stop Rule Creation ---');
    try {
        const tenant = await prisma.tenant.findFirst();
        const stop = await prisma.stop.findFirst();

        if (!tenant || !stop) {
            console.error('Missing data for stop rule test');
            return;
        }

        const result = await prisma.stopRule.create({
            data: {
                tenantId: tenant.id,
                stopId: stop.id,
                minDwellTimeMinutes: 5,
                maxDwellMinutes: 10,
                fineAmountUsd: 15.0,
                penaltyPerMinuteUsd: 2.0
            }
        });
        console.log('Success creating stop rule:', result.id);
        await prisma.stopRule.delete({ where: { id: result.id } });
    } catch (e) {
        console.error('FAILED creating stop rule:', e);
    }
}

test().finally(() => prisma.$disconnect());
