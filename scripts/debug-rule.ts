import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugRuleCreation() {
    // 1. Get a valid user token (or mimic auth/tenant)
    // For simplicity, we'll hit the endpoint but we need a valid token.
    // Alternatively, we can use prisma directly to see if it works, BUT the error is likely in the API layer/Controller.
    // Let's force-create a rule via Prisma first to see if the DB schema allows it.

    const tenant = await prisma.tenant.findFirst();
    let route = await prisma.route.findFirst({ include: { stops: true } });

    if (!tenant) {
        console.error('❌ Need a tenant.');
        return;
    }

    route = await prisma.route.findFirst({ include: { stops: true } });

    if (!route || route.stops.length < 2) {
        console.log('⚠️ No sufficient route found. Creating dummy route and stops...');
        route = await prisma.route.create({
            data: {
                tenantId: tenant.id,
                name: 'Debug Route',
                stops: {
                    create: [
                        { tenantId: tenant.id, name: 'Debug Stop A', order: 1 },
                        { tenantId: tenant.id, name: 'Debug Stop B', order: 2 }
                    ]
                }
            },
            include: { stops: true }
        });
    }

    const fromStop = route.stops[0];
    const toStop = route.stops[1];

    console.log(`Testing Rule Creation for Tenant: ${tenant.name}, Route: ${route.name}`);
    console.log(`From: ${fromStop.name}, To: ${toStop.name}`);

    // Test Prisma Creation directly (Bypass API)
    try {
        console.log('👉 Attempting PRISMA creation...');
        const rule = await prisma.segmentRule.create({
            data: {
                tenantId: tenant.id,
                routeId: route.id,
                fromStopId: fromStop.id,
                toStopId: toStop.id,
                expectedMaxMinutes: 30, // Int
                expectedMinMinutes: null, // Optional Int
                fineAmountUsd: 1.50, // Decimal/Float
                active: true
            }
        });
        console.log('✅ Prisma Creation SUCCESS:', rule.id);

        // Clean up
        await prisma.segmentRule.delete({ where: { id: rule.id } });
    } catch (error: any) {
        console.error('❌ Prisma Creation FAILED:', error.message);
    }

    // Now let's try to mimic the payload that failed in the frontend
    // We can't easily curl without a JWT, but the Prisma test above proves if the DB rejects it.
    // If Prisma works, the issue is in the API route handler (req.body parsing) or the payload sent.

    const payload = {
        fromStopId: fromStop.id,
        toStopId: toStop.id,
        maxTimeMinutes: "30", // Frontend sends string from input usually?
        fineAmountUsd: "1.50", // Frontend sends string?
        routeId: route.id
    };

    console.log('\n👉 Simulating Controller Logic (Sanitization check)...');

    // Logic from the controller:
    /*
    router.post('/segment-rules', async (req: AuthRequest, res: Response) => {
        try {
            const rule = await prisma.segmentRule.create({
                data: { ...req.body, tenantId: req.user?.tenantId as string }
            });
            res.status(201).json(rule);
        } catch (error) {
            res.status(400).json({ error: 'Could not create segment rule' });
        }
    });
    */

    // The previous error was that `maxTimeMinutes` was passed to prisma.create which doesn't exist.
    // Also `expectedMaxMinutes` was likely string "30" not int 30.

    const sanitizedPayload: any = {
        tenantId: tenant.id,
        routeId: payload.routeId,
        fromStopId: payload.fromStopId,
        toStopId: payload.toStopId,
        // Backend expects:
        expectedMaxMinutes: parseInt(payload.maxTimeMinutes),
        fineAmountUsd: parseFloat(payload.fineAmountUsd)
    };

    try {
        await prisma.segmentRule.create({ data: sanitizedPayload });
        console.log('✅ Manual Sanitization Logic SUCCESS');
    } catch (e: any) {
        console.error('❌ Manual Sanitization Logic FAILED:', e.message);
    }
}

debugRuleCreation();
