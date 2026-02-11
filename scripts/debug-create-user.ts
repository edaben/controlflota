
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'control-bus-super-secret-jwt-key-change-in-production-2024';
const API_URL = 'http://localhost:3000/api/users';

async function main() {
    try {
        console.log('Connecting to database...');
        const tenant = await prisma.tenant.findFirst();

        if (!tenant) {
            console.error('No tenant found. Please migrate/seed database first.');
            return;
        }

        console.log('Found tenant:', tenant.name, tenant.id);

        const tokenPayload = {
            id: 'debug-user-id',
            email: 'debug@admin.com',
            role: 'SUPER_ADMIN',
            tenantId: tenant.id
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });
        console.log('Generated token for SUPER_ADMIN');

        const userData = {
            email: `test-user-${Date.now()}@example.com`,
            password: 'Password123!',
            role: 'CLIENT_USER'
        };

        console.log('Attempting to create user:', userData);

        try {
            const response = await axios.post(API_URL, userData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log('✅ User created successfully:', response.data);
        } catch (error: any) {
            console.error('❌ API Request failed:', error.response?.status, error.response?.data || error.message);
        }

    } catch (err) {
        console.error('Script error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
