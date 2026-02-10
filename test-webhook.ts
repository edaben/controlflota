import axios from 'axios';

async function testWebhook() {
    // Reemplaza con una API Key válida de un Tenant
    const apiKey = 'api-key-1770700824163';
    const url = 'http://localhost:3000/api/webhook/traccar';

    try {
        console.log('Enviando evento de prueba al webhook...');
        const response = await axios.post(url, {
            deviceId: 12345,
            type: 'deviceOverspeed',
            speed: 85,
            serverTime: new Date().toISOString(),
            attributes: {
                speed: 85,
                course: 180
            }
        }, {
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log('Respuesta del servidor:', response.status, response.data);
        console.log('¡Prueba completada!');
    } catch (error: any) {
        console.error('Error enviando al webhook:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Message:', error.message);
        }
    }
}

testWebhook();
