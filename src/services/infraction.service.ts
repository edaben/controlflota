import { PrismaClient, InfractionType } from '@prisma/client';

const prisma = new PrismaClient();

export class InfractionService {
    /**
     * Detecta infracciones por exceso de tiempo en parada (Dwell Time)
     */
    static async detectDwellTimeInfraction(tenantId: string, vehicleId: string, stopId: string, dwellMinutes: number) {
        const rule = await prisma.stopRule.findFirst({
            where: { tenantId, stopId, active: true }
        });

        if (rule) {
            // 1. Check Max Dwell Time (Excessive stop)
            if (dwellMinutes > rule.maxDwellMinutes) {
                const excessMinutes = dwellMinutes - rule.maxDwellMinutes;
                // Calculate dynamic fine: Base + (Excess * PenaltyPerMinute)
                const dynamicFine = Number(rule.fineAmountUsd) + (excessMinutes * Number(rule.penaltyPerMinuteUsd || 0));

                await this.createInfraction(tenantId, vehicleId, InfractionType.DWELL_TIME, dynamicFine, {
                    stopId,
                    dwellMinutes,
                    maxAllowed: rule.maxDwellMinutes,
                    excessMinutes
                });
            }
            // 2. Check Min Dwell Time (Too fast / "Correteo" at stop)
            else if (rule.minDwellTimeMinutes && dwellMinutes < rule.minDwellTimeMinutes) {
                const earlyMinutes = rule.minDwellTimeMinutes - dwellMinutes;
                // Use same penalty per minute for being early? Or base fine? 
                // Suggestion: Base fine + (Early * Penalty)
                const dynamicFine = Number(rule.fineAmountUsd) + (earlyMinutes * Number(rule.penaltyPerMinuteUsd || 0));

                await this.createInfraction(tenantId, vehicleId, InfractionType.DWELL_TIME, dynamicFine, {
                    stopId,
                    dwellMinutes,
                    minRequired: rule.minDwellTimeMinutes,
                    earlyMinutes,
                    subtype: 'MIN_DWELL_VIOLATION'
                });
            }
        }
    }

    /**
     * Detecta infracciones por exceso de velocidad
     * (Alerta directa de Traccar o chequeo contra SpeedZone)
     */
    static async detectOverspeedInfraction(tenantId: string, vehicleId: string, payload: any) {
        // Traccar envía la geocerca en payload.geofence o payload.geofenceId
        const geofenceId = (payload.geofenceId || payload.geofence?.id)?.toString();

        if (geofenceId) {
            const zoneRule = await prisma.speedZone.findFirst({
                where: { tenantId, geofenceId, active: true }
            });

            if (zoneRule) {
                // Robust speed extraction: Traccar sends it in position.speed or directly in payload.speed
                const rawSpeed = payload.position?.speed ?? payload.speed ?? 0;

                // Traccar normaliza a nudos (knots) en el core, pero webhooks pueden variar según config.
                // Generalmente es nudos. 1 knot = 1.852 km/h
                const speedKmh = Math.round(rawSpeed * 1.852);

                console.log(`[Overspeed] 🚗 Vehicle: ${vehicleId} | Zone: ${zoneRule.name} | Speed: ${speedKmh} km/h (Raw: ${rawSpeed}) | Max: ${zoneRule.maxSpeedKmh} km/h`);

                if (speedKmh > zoneRule.maxSpeedKmh) {
                    const excessKmh = speedKmh - zoneRule.maxSpeedKmh;
                    // Calculate dynamic fine: Base + (Excess * PenaltyPerKmhUsd)
                    const dynamicFine = Number(zoneRule.fineAmountUsd) + (excessKmh * Number(zoneRule.penaltyPerKmhUsd || 0));

                    console.log(`[Overspeed] 🚨 INFRACTION DETECTED! Speed: ${speedKmh} > ${zoneRule.maxSpeedKmh}. Fine: ${dynamicFine}`);

                    await this.createInfraction(tenantId, vehicleId, InfractionType.OVERSPEED, dynamicFine, {
                        speedKmh,
                        maxAllowed: zoneRule.maxSpeedKmh,
                        excessKmh,
                        zoneName: zoneRule.name,
                        rawSpeedKnots: rawSpeed
                    });
                }
            } else {
                console.log(`[Overspeed] ℹ️ Geofence ${geofenceId} has no active SpeedZone rule.`);
            }
        }
    }

    /**
     * Detecta infracciones por tiempo entre paradas (Tramo A -> B)
     */
    static async detectSegmentTimeInfraction(tenantId: string, vehicleId: string, toStopId: string, arrivalTime: Date) {
        // 1. Buscar la llegada anterior más reciente del vehículo que no sea esta misma
        const previousArrival = await prisma.stopArrival.findFirst({
            where: {
                vehicleId,
                tenantId,
                departedAt: { not: null },
                stopId: { not: toStopId }
            },
            orderBy: { departedAt: 'desc' }
        });

        if (!previousArrival || !previousArrival.departedAt) return;

        // 2. Buscar si existe una regla para el tramo: previousArrival.stopId -> toStopId
        const rule = await prisma.segmentRule.findFirst({
            where: {
                tenantId,
                fromStopId: previousArrival.stopId,
                toStopId,
                active: true
            }
        });

        if (rule) {
            const travelMinutes = Math.round((arrivalTime.getTime() - previousArrival.departedAt.getTime()) / 60000);

            // Si excede el máximo permitido (Retraso / "Tortuguismo")
            if (travelMinutes > rule.expectedMaxMinutes) {
                const excessMinutes = travelMinutes - rule.expectedMaxMinutes;
                const dynamicFine = Number(rule.fineAmountUsd) + (excessMinutes * Number(rule.penaltyPerMinuteUsd || 0));

                await this.createInfraction(tenantId, vehicleId, InfractionType.TIME_SEGMENT, dynamicFine, {
                    fromStopId: rule.fromStopId,
                    toStopId: rule.toStopId,
                    travelMinutes,
                    maxAllowed: rule.expectedMaxMinutes,
                    excessMinutes,
                    subtype: 'MAX_TIME_VIOLATION'
                });
            }
            // Si es menor que el mínimo permitido (Adelanto / "Correteo")
            else if (rule.expectedMinMinutes && travelMinutes < rule.expectedMinMinutes) {
                const earlyMinutes = rule.expectedMinMinutes - travelMinutes;
                const dynamicFine = Number(rule.fineAmountUsd) + (earlyMinutes * Number(rule.penaltyPerMinuteUsd || 0));

                await this.createInfraction(tenantId, vehicleId, InfractionType.TIME_SEGMENT, dynamicFine, {
                    fromStopId: rule.fromStopId,
                    toStopId: rule.toStopId,
                    travelMinutes,
                    minRequired: rule.expectedMinMinutes,
                    earlyMinutes,
                    subtype: 'MIN_TIME_VIOLATION'
                });
            }
        }
    }

    private static async createInfraction(tenantId: string, vehicleId: string, type: InfractionType, amount: any, details: any) {
        const infraction = await prisma.infraction.create({
            data: {
                tenantId,
                vehicleId,
                type,
                detectedAt: new Date(),
                details
            }
        });

        // Crear la multa automáticamente asociada a la infracción
        await prisma.fine.create({
            data: {
                tenantId,
                infractionId: infraction.id,
                amountUsd: amount
            }
        });

        // TODO: Generar Ticket individual si el tenant tiene configurado "Enviar ticket al instante"
    }
}
