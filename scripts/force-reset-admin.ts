
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('--- 🔍 DIAGNÓSTICO DE USUARIOS EN VPS ---');

    // 1. Listar todos los usuarios para saber quién existe
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

    // 2. Intentar Resetear admin principal
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    const firstTenant = await prisma.tenant.findFirst();

    if (!firstTenant) {
        console.log('❌ Error: No existe ninguna empresa (Tenant) en la DB. Ejecuta las migraciones/seed.');
        return;
    }

    // Lista de posibles emails de admin a resetear
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
            console.log(`🏢 Vinculado a empresa: ${firstTenant.name}`);
            resetDone = true;
            break;
        }
    }

    if (!resetDone) {
        console.log('\n❌ No se encontró ningún admin conocido para resetear.');
        console.log('Intentando crear uno nuevo...');
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

    console.log('\n🚀 Prueba a entrar ahora con el email indicado y la clave admin123');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
