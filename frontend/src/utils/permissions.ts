
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

    // 2. Sumar permisos manuales y del perfil
    const effectivePermissions = Array.from(new Set([
        ...(user.permissions || []),
        ...(user.profilePermissions || user.profile?.permissions || [])
    ]));

    // 3. Si hay permisos definidos (específicos o por perfil), esos son la fuente de verdad
    if (effectivePermissions.length > 0) {
        return effectivePermissions.includes(requiredPermission);
    }

    // 4. Si no tiene ninguno (usuarios antiguos), usar los del rol
    const roleDefaultPermissions = DEFAULT_ROLE_PERMISSIONS[user.role] || [];
    return roleDefaultPermissions.includes(requiredPermission);
};
