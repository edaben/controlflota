const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('--- 🔍 DIAGNÓSTICO DE USUARIOS EN VPS (JS MODE) ---');

    try {
        // 1. Listar todos los usuarios
        const users = await prisma.user.findMany({
            include: { tenant: true }
        });

        if (users.length === 0) {
            console.log('⚠️ No hay usuarios en la base de datos.');
        } else {
            console.log('Usuarios encontrados:');
            users.forEach(u => {
                console.log(`- [${u.role}] ${u.email} (Tenant: ${u.tenant?.name || 'NINGUNO'})`);
            });
        }

        // 2. Resetear admin
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);
        const firstTenant = await prisma.tenant.findFirst();

        if (!firstTenant) {
            console.log('❌ Error: No existe ninguna empresa (Tenant) en la DB.');
            return;
        }

        const adminEmails = ['admin@demo.com', 'superadmin@controlbus.com', 'admin@controlbus.com'];
        let resetDone = false;

        for (const email of adminEmails) {
            const user = await prisma.user.findUnique({ where: { email } });
            if (user) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        password: hashedPassword,
                        tenantId: firstTenant.id
                    }
                });
                console.log(`\n✅ ACCESO RECUPERADO para: ${email}`);
                console.log(`🔑 Nueva contraseña: ${password}`);
                resetDone = true;
                break;
            }
        }

        if (!resetDone) {
            console.log('\n❌ No se encontró ningún admin conocido. Creando uno nuevo...');
            const newUser = await prisma.user.create({
                data: {
                    email: 'admin@demo.com',
                    password: hashedPassword,
                    role: 'SUPER_ADMIN',
                    tenantId: firstTenant.id
                }
            });
            console.log(`✅ NUEVO ADMIN CREADO: ${newUser.email} / ${password}`);
        }

        console.log('\n🚀 Prueba a entrar ahora con la clave admin123');
    } catch (error) {
        console.error('\n💥 Error ejecutando el script:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
