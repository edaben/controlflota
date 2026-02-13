import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { Permission, DEFAULT_ROLE_PERMISSIONS } from '../constants/permissions';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        tenantId?: string | null;
        permissions?: string[];
        profileId?: string | null;
    };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token) as any;

    if (!decoded) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = decoded;
    next();
};

/**
 * Middleware para autorizar basado en roles O permisos específicos.
 * @param roles Roles permitidos (ej: ['SUPER_ADMIN'])
 * @param requiredPermissions Permisos necesarios (opcional)
 */
export const authorize = (roles: string[] = [], requiredPermissions: Permission[] = []) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // 1. SUPER_ADMIN siempre tiene acceso total
        if (req.user.role === 'SUPER_ADMIN') {
            return next();
        }

        // 2. Verificar Roles (Backward compatibility)
        const hasRole = roles.length === 0 || roles.includes(req.user.role);

        // 3. Verificar Permisos
        // Nota: req.user.permissions ya incluye los permisos del perfil (mezclados en el login)
        const effectivePermissions = req.user.permissions || [];
        const roleDefaultPermissions = DEFAULT_ROLE_PERMISSIONS[req.user.role] || [];

        // Si no tiene permisos específicos, usamos los del rol
        const finalPermissions = effectivePermissions.length > 0
            ? effectivePermissions
            : roleDefaultPermissions;

        const hasPermissions = requiredPermissions.length === 0 ||
            requiredPermissions.every(p => finalPermissions.includes(p));

        if (hasRole && hasPermissions) {
            return next();
        }

        return res.status(403).json({ error: 'Insufficient permissions' });
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
