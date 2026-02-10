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

        if (rule && dwellMinutes > rule.maxDwellMinutes) {
            await this.createInfraction(tenantId, vehicleId, InfractionType.DWELL_TIME, rule.fineAmountUsd, {
                stopId,
                dwellMinutes,
                maxAllowed: rule.maxDwellMinutes
            });
        }
    }

    /**
     * Detecta infracciones por exceso de velocidad
     * (Alerta directa de Traccar o chequeo contra SpeedZone)
     */
    static async detectOverspeedInfraction(tenantId: string, vehicleId: string, payload: any) {
        // 1. Basado en alerta directa de Traccar
        // TODO: Mapear si el evento cayó en una SpeedZone específica para usar ese monto de multa
        const defaultSpeedFine = 0; // Podría haber una multa global

        // Por ahora, si hay reglas de SpeedZone, buscamos si la posición coincide
        // Simplificación: Si el evento trae geofenceId, buscamos la regla de velocidad para esa geocerca
        if (payload.geofenceId) {
            const zoneRule = await prisma.speedZone.findFirst({
                where: { tenantId, geofenceId: payload.geofenceId.toString(), active: true }
            });

            if (zoneRule) {
                const currentSpeed = payload.speed || 0; // Traccar envía velocidad en nudos (knots) usualmente
                const speedKmh = Math.round(currentSpeed * 1.852);

                if (speedKmh > zoneRule.maxSpeedKmh) {
                    await this.createInfraction(tenantId, vehicleId, InfractionType.OVERSPEED, zoneRule.fineAmountUsd, {
                        speedKmh,
                        maxAllowed: zoneRule.maxSpeedKmh,
                        zoneName: zoneRule.name
                    });
                }
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

            // Si excede el máximo permitido
            if (travelMinutes > rule.expectedMaxMinutes) {
                await this.createInfraction(tenantId, vehicleId, InfractionType.TIME_SEGMENT, rule.fineAmountUsd, {
                    fromStopId: rule.fromStopId,
                    toStopId: rule.toStopId,
                    travelMinutes,
                    maxAllowed: rule.expectedMaxMinutes
                });
            }
            // Opcional: Si es menor que el mínimo permitido (correteos)
            else if (rule.expectedMinMinutes && travelMinutes < rule.expectedMinMinutes) {
                await this.createInfraction(tenantId, vehicleId, InfractionType.TIME_SEGMENT, rule.fineAmountUsd, {
                    fromStopId: rule.fromStopId,
                    toStopId: rule.toStopId,
                    travelMinutes,
                    minRequired: rule.expectedMinMinutes,
                    type: 'MIN_TIME_VIOLATION'
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
