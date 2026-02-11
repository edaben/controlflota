
import { PERMISSIONS, DEFAULT_ROLE_PERMISSIONS, Permission } from '@/constants/permissions';

/**
 * Verifica si un usuario tiene un permiso específico.
 * @param user Objeto de usuario (desde localStorage/contexto)
 * @param requiredPermission El permiso a verificar
 * @returns true si tiene acceso
 */
export const hasPermission = (user: any, requiredPermission: Permission): boolean => {
    if (!user) return false;

    // 1. SUPER_ADMIN siempre tiene acceso total
    if (user.role === 'SUPER_ADMIN') return true;

    // 2. Si el usuario tiene permisos explícitos definidos, esos son la fuente de verdad única
    if (user.permissions && user.permissions.length > 0) {
        return user.permissions.includes(requiredPermission);
    }

    // 3. Si no tiene permisos explícitos (ej. usuarios antiguos), usar los del rol
    const roleDefaultPermissions = DEFAULT_ROLE_PERMISSIONS[user.role] || [];
    return roleDefaultPermissions.includes(requiredPermission);
};
