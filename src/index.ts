import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.routes';
import webhookRoutes from './routes/webhook.routes';
import entityRoutes from './routes/entities.routes';
import ruleRoutes from './routes/rules.routes';
import reportRoutes from './routes/reports.routes';
import stopRoutes from './routes/stops.routes';
import ownerRoutes from './routes/owner.routes';
import profileRoutes from './routes/profiles.routes';
import { SchedulerService } from './services/scheduler.service';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// Global error handler
app.use((err: any, req: Request, res: Response, next: any) => {
    console.error('💥 GLOBAL ERROR:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (['POST', 'PUT'].includes(req.method)) {
        console.log(`[DEBUG BODY]`, JSON.stringify(req.body, null, 2));
    }
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/owner', ownerRoutes); // Move here: Public access via Magic Link
app.use('/api', entityRoutes);
app.use('/api', ruleRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api', stopRoutes);
app.use('/api/profiles', profileRoutes);

// Initialize Scheduler
SchedulerService.init();

// Basic health check
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Control Bus API'
    });
});

app.listen(Number(port), '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${port}`);
});

process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
