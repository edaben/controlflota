import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authenticate, tenantMiddleware } from '../middleware/auth.middleware';
import fs from 'fs';
import path from 'path';

const router = Router();
const prisma = new PrismaClient();

console.log('✅ Rules routes module loaded');

function logError(action: string, req: AuthRequest, error: any) {
    const logPath = path.join(process.cwd(), 'rules-error.log');
    const entry = `\n[${new Date().toISOString()}] ACTION: ${action}
BODY: ${JSON.stringify(req.body, null, 2)}
USER: ${JSON.stringify(req.user, null, 2)}
ERROR: ${error.stack || error.message || error}
------------------------------------------\n`;
    fs.appendFileSync(logPath, entry);
}

const sanitizeInt = (val: any) => {
    const p = parseInt(val);
    return isNaN(p) ? undefined : p;
};

const sanitizeFloat = (val: any) => {
    const p = parseFloat(val);
    return isNaN(p) ? undefined : p;
};

router.use(authenticate, tenantMiddleware);

router.get('/test-me', (req: AuthRequest, res: Response) => {
    res.json({ message: 'Rules routes are working', user: req.user });
});

// --- Segment Rules (Tramo A -> B) ---
router.get('/segment-rules', async (req: AuthRequest, res: Response) => {
    const rules = await prisma.segmentRule.findMany({
        where: { tenantId: req.user?.tenantId as string },
        include: { fromStop: true, toStop: true, route: true }
    });
    res.json(rules);
});

router.post('/segment-rules', async (req: AuthRequest, res: Response) => {
    console.log('📥 POST /segment-rules received', req.body);
    const fromStopId = (req.body.fromStopId || '').toString().trim();
    const toStopId = (req.body.toStopId || '').toString().trim();
    const routeId = (req.body.routeId || '').toString().trim();
    const expectedMaxMinutes = parseInt(req.body.expectedMaxMinutes) || 30;
    const fineAmountUsd = parseFloat(req.body.fineAmountUsd) || 0;
    const penaltyPerMinuteUsd = parseFloat(req.body.penaltyPerMinuteUsd) || 0;

    try {
        if (!fromStopId || !toStopId || !routeId) {
            return res.status(400).json({ error: 'Faltan campos obligatorios (Paradas o Ruta)' });
        }
        const rule = await prisma.segmentRule.create({
            data: {
                tenantId: req.user?.tenantId as string,
                routeId,
                fromStopId,
                toStopId,
                expectedMaxMinutes,
                fineAmountUsd,
                penaltyPerMinuteUsd
            }
        });
        res.status(201).json(rule);
    } catch (error) {
        logError('CREATE_SEGMENT_RULE', req, error);
        console.error('[Rules] ❌ Error creating segment rule:', error);
        res.status(500).json({ error: 'Error creating segment rule', details: (error as any).message });
    }
});

router.put('/segment-rules/:id', async (req: AuthRequest, res: Response) => {
    console.log('📥 PUT /segment-rules received', req.params.id, req.body);
    const { id } = req.params;
    const { expectedMaxMinutes, fineAmountUsd } = req.body;
    try {
        const rule = await prisma.segmentRule.update({
            where: { id },
            data: {
                routeId: req.body.routeId || undefined,
                fromStopId: req.body.fromStopId || undefined,
                toStopId: req.body.toStopId || undefined,
                expectedMaxMinutes: sanitizeInt(req.body.expectedMaxMinutes),
                fineAmountUsd: sanitizeFloat(req.body.fineAmountUsd),
                penaltyPerMinuteUsd: sanitizeFloat(req.body.penaltyPerMinuteUsd)
            }
        });
        res.json(rule);
    } catch (error) {
        logError('UPDATE_SEGMENT_RULE', req, error);
        console.error('[Rules] ❌ Error updating segment rule:', error);
        res.status(500).json({ error: 'Error updating segment rule', details: (error as any).message });
    }
});

router.delete('/segment-rules/:id', async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.segmentRule.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting segment rule' });
    }
});

// --- Stop Rules (Dwell Time) ---
router.get('/stop-rules', async (req: AuthRequest, res: Response) => {
    const rules = await prisma.stopRule.findMany({
        where: { tenantId: req.user?.tenantId as string },
        include: { stop: true }
    });
    res.json(rules);
});

router.post('/stop-rules', async (req: AuthRequest, res: Response) => {
    console.log('📥 POST /stop-rules received', req.body);
    const stopId = (req.body.stopId || '').toString().trim();
    const minDwellTimeMinutes = parseInt(req.body.minDwellTimeMinutes) || 0;
    const maxDwellMinutes = parseInt(req.body.maxDwellMinutes) || 5;
    const fineAmountUsd = parseFloat(req.body.fineAmountUsd) || 0;
    const penaltyPerMinuteUsd = parseFloat(req.body.penaltyPerMinuteUsd) || 0;

    try {
        if (!stopId) {
            return res.status(400).json({ error: 'Falta campo obligatorio (Parada)' });
        }
        const rule = await prisma.stopRule.create({
            data: {
                tenantId: req.user?.tenantId as string,
                stopId,
                minDwellTimeMinutes,
                maxDwellMinutes,
                fineAmountUsd,
                penaltyPerMinuteUsd
            }
        });
        res.status(201).json(rule);
    } catch (error) {
        logError('CREATE_STOP_RULE', req, error);
        console.error('[Rules] ❌ Error creating stop rule:', error);
        res.status(500).json({ error: 'Error creating stop rule', details: (error as any).message });
    }
});

router.put('/stop-rules/:id', async (req: AuthRequest, res: Response) => {
    console.log('📥 PUT /stop-rules received', req.params.id, req.body);
    const { id } = req.params;
    const { maxDwellMinutes, fineAmountUsd } = req.body;
    try {
        const rule = await prisma.stopRule.update({
            where: { id },
            data: {
                stopId: req.body.stopId || undefined,
                minDwellTimeMinutes: sanitizeInt(req.body.minDwellTimeMinutes),
                maxDwellMinutes: sanitizeInt(req.body.maxDwellMinutes),
                fineAmountUsd: sanitizeFloat(req.body.fineAmountUsd),
                penaltyPerMinuteUsd: sanitizeFloat(req.body.penaltyPerMinuteUsd)
            }
        });
        res.json(rule);
    } catch (error) {
        logError('UPDATE_STOP_RULE', req, error);
        console.error('[Rules] ❌ Error updating stop rule:', error);
        res.status(500).json({ error: 'Error updating stop rule', details: (error as any).message });
    }
});

router.delete('/stop-rules/:id', async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.stopRule.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting stop rule' });
    }
});

// --- Speed Zones ---
router.get('/speed-zones', async (req: AuthRequest, res: Response) => {
    const zones = await prisma.speedZone.findMany({
        where: { tenantId: req.user?.tenantId as string },
        include: { route: true, stop: true }
    });
    res.json(zones);
});

router.post('/speed-zones', async (req: AuthRequest, res: Response) => {
    console.log('[SpeedZones] 📥 Creating new speed zone:', JSON.stringify(req.body));
    const { name, routeId, stopId, geofenceId, maxSpeedKmh, fineAmountUsd, penaltyPerKmhUsd } = req.body;

    try {
        let finalGeofenceId = (geofenceId || '').toString().trim() || null;
        let finalStopId = (stopId || '').toString().trim() || null;
        let finalRouteId = (routeId || '').toString().trim() || null;

        // Si se provee stopId, intentar obtener el geofenceId de la parada si no hay uno manual
        if (finalStopId && !finalGeofenceId) {
            console.log(`[SpeedZones] 🔍 Looking up geofence for stop: ${finalStopId}`);
            try {
                const stop = await prisma.stop.findUnique({ where: { id: finalStopId } });
                if (stop?.geofenceId) {
                    finalGeofenceId = stop.geofenceId;
                    console.log(`[SpeedZones] ✅ Found geofenceId from stop: ${finalGeofenceId}`);
                }
            } catch (e) {
                console.error('[SpeedZones] ⚠️ Error looking up stop (non-critical):', e);
            }
        }

        console.log(`[SpeedZones] 💾 Saving to DB: Name=${name}, Geofence=${finalGeofenceId}, Stop=${finalStopId}`);

        const zone = await prisma.speedZone.create({
            data: {
                tenantId: req.user?.tenantId as string,
                name: name || 'Nueva Zona',
                routeId: finalRouteId,
                stopId: finalStopId,
                geofenceId: finalGeofenceId,
                maxSpeedKmh: Number(maxSpeedKmh) || 0,
                fineAmountUsd: Number(fineAmountUsd) || 0,
                penaltyPerKmhUsd: Number(penaltyPerKmhUsd || 0)
            }
        });

        console.log('[SpeedZones] ✅ Successfully created zone:', zone.id);
        res.status(201).json(zone);
    } catch (error) {
        console.error('[SpeedZones] ❌ FATAL Error creating speed zone:', error);
        res.status(500).json({ error: 'Error creating speed zone', details: (error as any).message });
    }
});

router.put('/speed-zones/:id', async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name, stopId, maxSpeedKmh, fineAmountUsd, penaltyPerKmhUsd, geofenceId } = req.body;
    try {
        let finalGeofenceId = geofenceId;

        if (stopId && !finalGeofenceId) {
            const stop = await prisma.stop.findUnique({ where: { id: stopId } });
            if (stop?.geofenceId) {
                finalGeofenceId = stop.geofenceId;
            }
        }

        const zone = await prisma.speedZone.update({
            where: { id },
            data: {
                name,
                stopId: stopId || null,
                geofenceId: finalGeofenceId,
                maxSpeedKmh: Number(maxSpeedKmh),
                fineAmountUsd: Number(fineAmountUsd),
                penaltyPerKmhUsd: Number(penaltyPerKmhUsd || 0)
            }
        });
        res.json(zone);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating speed zone' });
    }
});

router.delete('/speed-zones/:id', async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.speedZone.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting speed zone' });
    }
});

export default router;
