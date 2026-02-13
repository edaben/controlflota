
/**
 * Catálogo de permisos del sistema
 */
export const PERMISSIONS = {
    // Dashboard & Reports
    VIEW_DASHBOARD: 'view:dashboard',
    VIEW_REPORTS: 'view:reports',
    MANAGE_REPORTS: 'manage:reports',

    // Infractions & Fines
    VIEW_INFRACTIONS: 'view:infractions',
    MANAGE_INFRACTIONS: 'manage:infractions',
    VIEW_FINES: 'view:fines',
    MANAGE_FINES: 'manage:fines',

    // Vehicles & Fleets
    VIEW_VEHICLES: 'view:vehicles',
    MANAGE_VEHICLES: 'manage:vehicles',

    // Routes & Rules
    VIEW_ROUTES: 'view:routes',
    MANAGE_ROUTES: 'manage:routes',
    VIEW_RULES: 'view:rules',
    MANAGE_RULES: 'manage:rules',

    // User Management
    VIEW_USERS: 'view:users',
    MANAGE_USERS: 'manage:users',

    // Settings
    MANAGE_SETTINGS: 'manage:settings',

    // Multi-tenant (Super Admin only usually)
    VIEW_TENANTS: 'view:tenants',
    MANAGE_TENANTS: 'manage:tenants',

    // Extra Actions
    BULK_DELETE: 'manage:bulk_delete',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Permisos por defecto por rol
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
    SUPER_ADMIN: Object.values(PERMISSIONS) as Permission[],
    CLIENT_ADMIN: [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_REPORTS,
        PERMISSIONS.MANAGE_REPORTS,
        PERMISSIONS.VIEW_INFRACTIONS,
        PERMISSIONS.MANAGE_INFRACTIONS,
        PERMISSIONS.VIEW_FINES,
        PERMISSIONS.MANAGE_FINES,
        PERMISSIONS.VIEW_VEHICLES,
        PERMISSIONS.MANAGE_VEHICLES,
        PERMISSIONS.VIEW_ROUTES,
        PERMISSIONS.MANAGE_ROUTES,
        PERMISSIONS.VIEW_RULES,
        PERMISSIONS.MANAGE_RULES,
        PERMISSIONS.VIEW_USERS,
        PERMISSIONS.MANAGE_USERS,
        PERMISSIONS.MANAGE_SETTINGS,
    ],
    CLIENT_USER: [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_REPORTS,
        PERMISSIONS.VIEW_INFRACTIONS,
        PERMISSIONS.VIEW_FINES,
        PERMISSIONS.VIEW_VEHICLES,
        PERMISSIONS.VIEW_ROUTES,
        PERMISSIONS.VIEW_RULES,
    ]
};
