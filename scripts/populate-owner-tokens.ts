import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

const generateRandomToken = (length: number = 32): string => {
    return crypto.randomBytes(length).toString('hex');
};

async function populateTokens() {
    const vehicles = await prisma.vehicle.findMany({
        where: { ownerToken: null }
    });

    console.log(`Found ${vehicles.length} vehicles without tokens.`);

    for (const vehicle of vehicles) {
        const token = generateRandomToken();
        await prisma.vehicle.update({
            where: { id: vehicle.id },
            data: { ownerToken: token }
        });
        console.log(`Generated token for vehicle: ${vehicle.plate}`);
    }

    console.log('✅ Done populating tokens.');
}

populateTokens()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
