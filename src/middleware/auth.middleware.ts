import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        tenantId?: string | null;
    };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = decoded;
    next();
};

export const authorize = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        next();
    };
};

export const tenantMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    // Solo aplicamos aislamiento si el usuario no es SUPER_ADMIN
    // O si queremos que el SUPER_ADMIN actúe en el contexto de un tenant específico
    if (req.user && req.user.role !== 'SUPER_ADMIN') {
        if (!req.user.tenantId) {
            return res.status(403).json({ error: 'Tenant context required' });
        }
    }
    next();
};
