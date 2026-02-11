
import axios from 'axios';

async function testAutoCreateVehicle() {
    const url = 'http://localhost:3000/api/webhook/traccar';
    // USANDO API KEY REAL DEL TENANT "test" (obtenida de la DB)
    const apiKey = 'api-key-1770700824163';
    const newDeviceId = Math.floor(Math.random() * 100000) + 900000; // ID aleatorio

    const payload = {
        deviceId: newDeviceId,
        type: 'geofenceEnter',
        device: {
            id: newDeviceId,
            name: `Test Bus ${newDeviceId}`,
            uniqueId: `imei-${newDeviceId}`,
            plate_number: `XYZ-${newDeviceId.toString().substring(0, 3)}`
        },
        geofenceId: 99,
        geofence: {
            id: 99,
            name: 'Test Geofence Circle',
            area: 'CIRCLE (-0.123 51.50, 150)' // Center Lat/Lng, Radius 150m
        },
        serverTime: new Date().toISOString(),
        position: {
            latitude: -0.123,
            longitude: 51.50,
            speed: 10
        }
    };

    console.log(`--- Testing Auto-Create Vehicle for Device ID: ${newDeviceId} ---`);
    console.log(`Expected Plate: ${payload.device.plate_number}`);
    console.log(`API Key: ${apiKey}`);

    try {
        const response = await axios.post(url, payload, {
            headers: { 'x-api-key': apiKey }
        });
        console.log('Webhook Response Status:', response.status);
        console.log('Webhook Response Data:', response.data);
    } catch (error: any) {
        console.error('Webhook Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testAutoCreateVehicle();
