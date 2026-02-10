import { PrismaClient } from '@prisma/client';
import { InfractionService } from './infraction.service';

const prisma = new PrismaClient();

export class WebhookService {
    static async processEvent(tenantId: string, deviceId: string, eventType: string, payload: any) {
        // 1. Guardar el evento raw
        const event = await prisma.gpsEvent.create({
            data: {
                tenantId,
                deviceId: deviceId.toString(),
                eventType,
                rawPayload: payload
            }
        });

        // 1.5 Verificar si el vehículo existe, si no, crearlo automáticamente
        const traccarId = parseInt(deviceId);
        console.log(`[Webhook] Processing deviceId: ${deviceId} (Parsed: ${traccarId})`);

        if (isNaN(traccarId)) {
            console.error(`[Webhook] Error: deviceId '${deviceId}' is not a valid number.`);
            return;
        }

        let vehicle = await prisma.vehicle.findUnique({
            where: { traccarDeviceId: traccarId }
        });

        if (!vehicle) {
            console.log(`[Webhook] ⚠️ Vehicle with traccarDeviceId ${traccarId} not found. Creating new vehicle...`);

            // Extraer datos del dispositivo del payload
            const deviceData = payload.device || {};
            const deviceName = deviceData.name || `AUTO-${traccarId}`;
            // Priorizar placa, luego nombre, luego ID
            let plate = deviceData.plate_number || deviceData.name || `PENDING-${traccarId}`;

            // Limpieza básica de placa si viene muy sucia (opcional, pero Traccar a veces manda basura)
            if (plate.length > 20) plate = plate.substring(0, 20);

            try {
                vehicle = await prisma.vehicle.create({
                    data: {
                        tenantId,
                        plate: plate,
                        traccarDeviceId: traccarId,
                        internalCode: deviceName
                    }
                });
                console.log(`[Webhook] ✅ Created new vehicle: ${vehicle.plate} (ID: ${vehicle.id})`);
            } catch (error) {
                console.error(`[Webhook] ❌ Error creating auto-vehicle ${traccarId}:`, error);
            }
        } else {
            console.log(`[Webhook] ℹ️ Vehicle found: ${vehicle.plate}`);

            // Auto-corrección: Si el vehículo tiene placa PENDING pero ahora viene info real, actualizamos
            if (vehicle.plate.startsWith('PENDING-')) {
                const deviceData = payload.device || {};
                const newPlate = deviceData.plate_number || deviceData.name;
                const newName = deviceData.name;

                if (newPlate && newPlate !== vehicle.plate) {
                    console.log(`[Webhook] 🔄 Updating PENDING vehicle ${vehicle.id} with real data: ${newPlate}`);
                    try {
                        vehicle = await prisma.vehicle.update({
                            where: { id: vehicle.id },
                            data: {
                                plate: newPlate.substring(0, 20),
                                internalCode: newName || vehicle.internalCode
                            }
                        });
                        console.log(`[Webhook] ✅ Vehicle updated to: ${vehicle.plate}`);
                    } catch (error) {
                        console.error(`[Webhook] ❌ Error updating vehicle ${vehicle.id}:`, error);
                    }
                }
            }
        }

        // 2. Procesar según tipo de evento
        try {
            if (eventType === 'geofenceEnter') {
                await this.handleGeofenceEnter(tenantId, deviceId.toString(), payload);
            } else if (eventType === 'geofenceExit') {
                await this.handleGeofenceExit(tenantId, deviceId.toString(), payload);
            } else if (eventType === 'deviceOverspeed') {
                await this.handleOverspeed(tenantId, deviceId.toString(), payload);
            }

            // Marcar como procesado
            await prisma.gpsEvent.update({
                where: { id: event.id },
                data: { processedAt: new Date() }
            });
        } catch (error) {
            console.error('Error processing webhook event:', error);
        }
    }

    private static async handleGeofenceEnter(tenantId: string, deviceId: string, payload: any) {
        const geofenceId = (payload.geofenceId || payload.geofence_id)?.toString();
        const geofenceName = payload.geofence?.name || payload.additional?.geofence || 'Unknown Geofence';

        if (!geofenceId) return;

        console.log(`[Webhook] 📍 Geofence Enter Detected: ${geofenceName} (ID: ${geofenceId}) for Device ${deviceId}`);

        // Buscar vehículo y parada
        const vehicle = await prisma.vehicle.findUnique({ where: { traccarDeviceId: parseInt(deviceId) } });
        // Buscar parada por ID de geocerca
        let stop = await prisma.stop.findFirst({ where: { tenantId, geofenceId } });

        // Si no se encuentra por ID, intentar buscar por nombre (match laxo) para facilitar configuración
        if (!stop && geofenceName) {
            stop = await prisma.stop.findFirst({
                where: {
                    tenantId,
                    name: { contains: geofenceName, mode: 'insensitive' }
                }
            });
            if (stop) console.log(`[Webhook] 🔗 Linked Geofence '${geofenceName}' to Stop '${stop.name}' by name match.`);
        }

        // AUTO-CREACIÓN: Si no existe la parada y tenemos ID y Nombre, la creamos
        if (!stop && geofenceId && geofenceName) {
            console.log(`[Webhook] 🆕 New Geofence detected: ${geofenceName} (ID: ${geofenceId}). Auto-creating...`);

            // 1. Buscar o crear ruta por defecto para importaciones
            let defaultRoute = await prisma.route.findFirst({
                where: { tenantId, name: 'Geocercas Importadas' }
            });

            if (!defaultRoute) {
                defaultRoute = await prisma.route.create({
                    data: {
                        tenantId,
                        name: 'Geocercas Importadas',
                        description: 'Geocercas detectadas automáticamente desde Traccar'
                    }
                });
            }

            // 2. Crear la parada
            try {
                stop = await prisma.stop.create({
                    data: {
                        tenantId,
                        routeId: defaultRoute.id,
                        name: geofenceName,
                        geofenceId: geofenceId,
                        order: 0
                    }
                });
                console.log(`[Webhook] ✅ Stop auto-created: ${stop.name} in route 'Geocercas Importadas'`);
            } catch (error) {
                console.error(`[Webhook] ❌ Error auto-creating stop:`, error);
            }
        }

        if (vehicle && stop) {
            console.log(`[Webhook] 🚌 Bus ${vehicle.plate} arrived at Stop ${stop.name}`);
            // Registrar llegada
            await prisma.stopArrival.create({
                data: {
                    tenantId,
                    vehicleId: vehicle.id,
                    stopId: stop.id,
                    arrivedAt: new Date(payload.serverTime || payload.time || new Date())
                }
            });
        } else {
            if (!vehicle) console.log(`[Webhook] ⚠️ Vehicle not found for ID ${deviceId}`);
            if (!stop) console.log(`[Webhook] ⚠️ No Stop configured for Geofence '${geofenceName}' (ID: ${geofenceId}). Go to Rules > Stops to link it.`);
        }
    }

    private static async handleGeofenceExit(tenantId: string, deviceId: string, payload: any) {
        const geofenceId = (payload.geofenceId || payload.geofence_id)?.toString();
        if (!geofenceId) return;

        const vehicle = await prisma.vehicle.findUnique({ where: { traccarDeviceId: parseInt(deviceId) } });
        const stop = await prisma.stop.findFirst({ where: { tenantId, geofenceId } });

        if (vehicle && stop) {
            // Buscar la última llegada abierta (sin departedAt)
            const lastArrival = await prisma.stopArrival.findFirst({
                where: {
                    vehicleId: vehicle.id,
                    stopId: stop.id,
                    departedAt: null
                },
                orderBy: { arrivedAt: 'desc' }
            });

            if (lastArrival) {
                const departedAt = new Date(payload.serverTime || payload.time || new Date());
                const dwellMinutes = Math.round((departedAt.getTime() - lastArrival.arrivedAt.getTime()) / 60000);

                await prisma.stopArrival.update({
                    where: { id: lastArrival.id },
                    data: { departedAt, dwellMinutes }
                });

                // Disparar detección de dwell time (exceso en parada)
                await InfractionService.detectDwellTimeInfraction(tenantId, vehicle.id, stop.id, dwellMinutes);
            }
        }
    }

    private static async handleOverspeed(tenantId: string, deviceId: string, payload: any) {
        const vehicle = await prisma.vehicle.findUnique({ where: { traccarDeviceId: parseInt(deviceId) } });
        if (vehicle) {
            // Disparar detección de velocidad
            await InfractionService.detectOverspeedInfraction(tenantId, vehicle.id, payload);
        }
    }
}
