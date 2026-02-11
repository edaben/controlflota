
import axios from 'axios';

async function testWebhook() {
    // URL del webhook local
    const url = 'http://localhost:3000/api/webhook/traccar';

    // API Key del Tenant "Empresa Demo" (configurada en seed.ts)
    const apiKey = 'demo-api-key-12345';

    // Payload de ejemplo (Evento de exceso de velocidad)
    const payload = {
        deviceId: 999999, // ID del dispositivo
        type: 'deviceOverspeed', // Tipo de evento
        eventId: 1234,
        serverTime: new Date().toISOString(),
        position: {
            latitude: -12.046374,
            longitude: -77.042793,
            speed: 45.5 // En nudos (knots). 45.5 knots ~= 84 km/h
        },
        attributes: {
            speedLimit: 60
        }
    };

    console.log('--- Enviando Webhook Simulado ---');
    console.log(`URL: ${url}`);
    console.log(`API Key: ${apiKey}`);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    try {
        const response = await axios.post(url, payload, {
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log('\n✅ Webhook enviado correctamente!');
        console.log('Status:', response.status);
        console.log('Respuesta:', response.data);
    } catch (error: any) {
        console.error('\n❌ Error al enviar webhook:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

testWebhook();
