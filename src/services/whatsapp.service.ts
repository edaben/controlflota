import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class WhatsAppService {
    /**
     * Enviar mensaje de WhatsApp (Mock)
     * En el futuro, esto se integrará con Twilio, Meta API, o un servicio propio.
     */
    static async sendMessage(phone: string, message: string) {
        console.log(`[WhatsApp] 📱 Sending message to ${phone}:`);
        console.log(`[WhatsApp] 💬 "${message}"`);

        // Simular latencia de red
        await new Promise(resolve => setTimeout(resolve, 500));

        return { success: true, messageId: `msg_${Date.now()}` };
    }

    /**
     * Enviar Link Mágico a un dueño
     */
    static async sendMagicLink(vehicleId: string) {
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId }
        });

        if (!vehicle || !vehicle.ownerPhone || !vehicle.ownerToken) {
            console.error(`[WhatsApp] ❌ Cannot send link: Missing data for vehicle ${vehicleId}`);
            return false;
        }

        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3002';
        const magicLink = `${baseUrl}/owner/${vehicle.ownerToken}`;

        const message = `Hola ${vehicle.ownerName || 'Propietario'}, usted puede revisar el estado de multas de su unidad ${vehicle.plate} en tiempo real aquí: ${magicLink}`;

        return this.sendMessage(vehicle.ownerPhone, message);
    }
}
