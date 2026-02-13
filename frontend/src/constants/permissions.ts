
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

    // Raw Data / Developer Logs
    VIEW_RAW_DATA: 'view:raw_data',

    // Extra Actions
    BULK_DELETE: 'manage:bulk_delete',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const PERMISSION_LABELS: Record<Permission, { label: string, category: string }> = {
    [PERMISSIONS.VIEW_DASHBOARD]: { label: 'Ver Dashboard', category: 'General' },
    [PERMISSIONS.VIEW_REPORTS]: { label: 'Ver Reportes', category: 'Reportes' },
    [PERMISSIONS.MANAGE_REPORTS]: { label: 'Configurar Reportes', category: 'Reportes' },
    [PERMISSIONS.VIEW_INFRACTIONS]: { label: 'Ver Infracciones', category: 'Infracciones' },
    [PERMISSIONS.MANAGE_INFRACTIONS]: { label: 'Gestionar Infracciones', category: 'Infracciones' },
    [PERMISSIONS.VIEW_FINES]: { label: 'Ver Multas', category: 'Multas' },
    [PERMISSIONS.MANAGE_FINES]: { label: 'Gestionar Multas', category: 'Multas' },
    [PERMISSIONS.VIEW_VEHICLES]: { label: 'Ver Vehículos', category: 'Vehículos' },
    [PERMISSIONS.MANAGE_VEHICLES]: { label: 'Gestionar Vehículos', category: 'Vehículos' },
    [PERMISSIONS.VIEW_ROUTES]: { label: 'Ver Rutas y Paradas', category: 'Rutas' },
    [PERMISSIONS.MANAGE_ROUTES]: { label: 'Gestionar Rutas y Paradas', category: 'Rutas' },
    [PERMISSIONS.VIEW_RULES]: { label: 'Ver Reglas', category: 'Reglas' },
    [PERMISSIONS.MANAGE_RULES]: { label: 'Gestionar Reglas', category: 'Reglas' },
    [PERMISSIONS.VIEW_USERS]: { label: 'Ver Usuarios', category: 'Admin' },
    [PERMISSIONS.MANAGE_USERS]: { label: 'Gestionar Usuarios', category: 'Admin' },
    [PERMISSIONS.MANAGE_SETTINGS]: { label: 'Configuración de Sistema', category: 'Admin' },
    [PERMISSIONS.VIEW_TENANTS]: { label: 'Ver Tenants (Super)', category: 'Super Admin' },
    [PERMISSIONS.MANAGE_TENANTS]: { label: 'Gestionar Tenants (Super)', category: 'Super Admin' },
    [PERMISSIONS.VIEW_RAW_DATA]: { label: 'Ver Datos Crudos (Logs)', category: 'Super Admin' },
    [PERMISSIONS.BULK_DELETE]: { label: 'Eliminación Masiva (Checks)', category: 'Seguridad' },
};

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
