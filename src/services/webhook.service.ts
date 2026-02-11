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
        let traccarId = parseInt(deviceId);
        console.log(`[Webhook] Processing deviceId raw: '${deviceId}'`);

        // Intento robusto de parseo si viene como objeto o string raro
        if (isNaN(traccarId)) {
            // A veces traccar manda cosas raras, intentamos extraer números
            const numericId = deviceId.toString().replace(/\D/g, '');
            if (numericId) {
                traccarId = parseInt(numericId);
                console.log(`[Webhook] ⚠️ Recovered numeric ID from '${deviceId}': ${traccarId}`);
            } else {
                console.error(`[Webhook] ❌ Error: deviceId '${deviceId}' could not be parsed to number.`);
                return;
            }
        }

        console.log(`[Webhook] Search/Create Vehicle with traccarId: ${traccarId}`);

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
        console.log(`[Webhook] 📍 Geofence Enter Processing for Device ${deviceId}`);

        // 1. Obtener o crear la parada (Geocerca)
        const stop = await this.getOrCreateStop(tenantId, payload);
        const vehicle = await prisma.vehicle.findUnique({ where: { traccarDeviceId: parseInt(deviceId) } });

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
            console.log(`[Webhook] ⚠️ Missing vehicle (${!!vehicle}) or stop (${!!stop}) for event processing.`);
        }
    }

    private static async handleGeofenceExit(tenantId: string, deviceId: string, payload: any) {
        console.log(`[Webhook] 🚩 Geofence Exit Processing for Device ${deviceId}`);

        // 1. Obtener o crear la parada (Geocerca) - Por si nos saltamos el Enter
        const stop = await this.getOrCreateStop(tenantId, payload);
        const vehicle = await prisma.vehicle.findUnique({ where: { traccarDeviceId: parseInt(deviceId) } });

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

    /**
     * Extrae de forma robusta los datos de la geocerca y la crea si no existe
     */
    private static async getOrCreateStop(tenantId: string, payload: any) {
        // Traccar manda la geocerca en distintos sitios según la versión o config
        const geofence = payload.geofence || payload.event?.attributes || payload.additional || {};
        const geofenceId = (payload.geofenceId || payload.geofence_id || geofence.id || geofence.geofenceId)?.toString();
        const geofenceName = geofence.name || geofence.geofenceName || geofence.geofence || 'Unknown Geofence';

        if (!geofenceId) {
            console.log('[Webhook] ⚠️ Could not find geofenceId in payload:', JSON.stringify(payload).substring(0, 200));
            return null;
        }

        // 1. Buscar parada existente
        let stop = await prisma.stop.findFirst({
            where: { tenantId, geofenceId }
        });

        if (!stop && geofenceName !== 'Unknown Geofence') {
            stop = await prisma.stop.findFirst({
                where: {
                    tenantId,
                    name: { equals: geofenceName, mode: 'insensitive' }
                }
            });
            if (stop) {
                console.log(`[Webhook] 🔗 Linked existing Stop '${stop.name}' to Geofence ID ${geofenceId} by name.`);
                await prisma.stop.update({ where: { id: stop.id }, data: { geofenceId } });
            }
        }

        if (stop) return stop;

        // 2. Si no existe, crearla automáticamente
        console.log(`[Webhook] 🆕 Auto-importing new Geofence: ${geofenceName} (ID: ${geofenceId})`);

        // Buscar o crear ruta por defecto
        let defaultRoute = await prisma.route.findFirst({ where: { tenantId, name: 'Geocercas Importadas' } });
        if (!defaultRoute) {
            defaultRoute = await prisma.route.create({
                data: { tenantId, name: 'Geocercas Importadas', description: 'Detectadas automáticamente desde Traccar' }
            });
        }

        // Extraer geometría
        let geofenceType: string | null = null;
        let geofenceRadius: number | null = null;
        let geofenceCoordinates = null;
        let stopLat = payload.latitude || null;
        let stopLng = payload.longitude || null;

        const area = (geofence.area || '').trim();
        console.log(`[Webhook] 🗺️ Parsing Geofence Geometry. Area: "${area}"`);

        if (area.toUpperCase().startsWith('CIRCLE')) {
            geofenceType = 'circle';
            // CIRCLE (longitude latitude, radius)
            const contentMatch = area.match(/CIRCLE\s*\(([^)]+)\)/i);
            if (contentMatch) {
                const inner = contentMatch[1].trim();
                const partsArr = inner.split(',');
                if (partsArr.length >= 2) {
                    const coords = partsArr[0].trim().split(/\s+/).map(Number);
                    geofenceRadius = Number(partsArr[1].trim());
                    if (coords.length >= 2) {
                        stopLng = coords[0];
                        stopLat = coords[1];
                    }
                }
            }
        } else if (area.toUpperCase().includes('POLYGON')) {
            geofenceType = 'polygon';
            // POLYGON ((lon lat, lon lat, ...))
            const contentMatch = area.match(/POLYGON\s*\(\s*\(\s*([^)]+)\s*\)\s*\)/i) || area.match(/POLYGON\s*\(\s*([^)]+)\s*\)/i);
            if (contentMatch) {
                const points = contentMatch[1].split(',').map((p: string) => {
                    const coords = p.trim().split(/\s+/).map(Number);
                    return { lat: coords[1], lng: coords[0] }; // LON LAT -> LAT LNG
                }).filter(p => !isNaN(p.lat) && !isNaN(p.lng));

                if (points.length > 0) {
                    geofenceCoordinates = points;
                    stopLat = points[0].lat;
                    stopLng = points[0].lng;
                }
            }
        }

        // Fallback si no se detectó tipo pero hay geocerca
        if (!geofenceType) {
            geofenceType = 'circle';
            geofenceRadius = 150;
        }

        try {
            return await prisma.stop.create({
                data: {
                    tenantId,
                    routeId: defaultRoute.id,
                    name: geofenceName,
                    geofenceId,
                    geofenceType,
                    geofenceRadius: geofenceType === 'circle' ? geofenceRadius : null,
                    geofenceCoordinates: geofenceCoordinates || undefined,
                    latitude: stopLat,
                    longitude: stopLng
                }
            });
        } catch (error) {
            console.error('[Webhook] ❌ Error creating stop:', error);
            return null;
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
