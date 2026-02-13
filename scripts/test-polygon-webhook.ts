
import axios from 'axios';

async function testPolygonWebhook() {
    const url = 'http://localhost:3000/api/webhook/traccar';
    const apiKey = 'demo-api-key-12345';

    const payload = {
        deviceId: 999999,
        type: 'geofenceEnter',
        serverTime: new Date().toISOString(),
        geofence_id: 8888,
        geofence: {
            name: "Test Polygon Geofence",
            coordinates: "[{\"lat\":-2.8773,\"lng\":-79.0475},{\"lat\":-2.8668,\"lng\":-79.0173},{\"lat\":-2.8470,\"lng\":-78.9928}]"
        }
    };

    console.log('--- Enviando Webhook de Polígono Simulado ---');
    try {
        const response = await axios.post(url, payload, {
            headers: { 'x-api-key': apiKey }
        });
        console.log('✅ Status:', response.status);
        console.log('Respuesta:', response.data);
    } catch (error: any) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testPolygonWebhook();
