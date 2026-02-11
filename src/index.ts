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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/webhook', webhookRoutes); // Mover antes para evitar interferencia de middleware en /api
app.use('/api', entityRoutes);
app.use('/api', ruleRoutes);
app.use('/api', reportRoutes);
app.use('/api', stopRoutes);

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

app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});

process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
