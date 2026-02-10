import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed de la base de datos...');

    // Crear tenant de prueba
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'demo' },
        update: {},
        create: {
            name: 'Empresa Demo',
            slug: 'demo',
            apiKey: 'demo-api-key-12345',
            active: true,
        },
    });

    console.log('✅ Tenant creado:', tenant.name);

    // Crear usuario Super Admin
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@demo.com' },
        update: {},
        create: {
            email: 'admin@demo.com',
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            tenantId: tenant.id,
        },
    });

    console.log('✅ Super Admin creado:', superAdmin.email);
    console.log('\n📋 Credenciales de acceso:');
    console.log('   Email: admin@demo.com');
    console.log('   Password: admin123');
    console.log('\n🎉 Seed completado exitosamente!');
}

main()
    .catch((e) => {
        console.error('❌ Error en seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
