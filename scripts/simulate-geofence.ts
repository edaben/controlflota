import axios from 'axios';

async function simulateGeofenceEnter() {
    // API Key de prueba (asegúrate que coincida con la de tu BD o usa una conocida)
    // En el seed original solía ser 'api-key-123456789' o similar. 
    // Si no la sabes, el log del backend suele mostrar "Invalid API Key" o similar si falla.
    // Intentaremos con la del último log del usuario o una genérica.
    // El usuario mostró logs de "Empresa Demo", asumo que tiene una API Key válida configurada.
    // Voy a intentar leerla de la base de datos primero si fallara, pero probemos con una dummy que quizás esté en el seed.

    const apiKey = 'system-admin-key'; // API Key del System Admin (admin@controlbus.com)
    const url = 'http://localhost:3000/api/webhook/traccar';

    const payload = {
        deviceId: 12345, // ID de dispositivo
        type: 'geofenceEnter',
        eventId: 9999,
        serverTime: new Date().toISOString(),
        geofenceId: 777, // ID NUEVO de geocerca
        geofence: {
            id: 777,
            name: 'Parada Test Auto-Created',
            description: 'Created by simulation script'
        }
    };

    try {
        console.log('🚀 Enviando evento geofenceEnter simulado...');
        console.log('Payload:', JSON.stringify(payload, null, 2));

        const response = await axios.post(url, payload, {
            headers: {
                'x-api-key': apiKey, // Esto puede fallar si no es la correcta
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Respuesta del servidor:', response.status);
        console.log('👉 Ahora revisa si se creó la ruta "Geocercas Importadas" y la parada "Parada Test Auto-Created"');
    } catch (error: any) {
        console.error('❌ Error enviando webhook:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

simulateGeofenceEnter();
