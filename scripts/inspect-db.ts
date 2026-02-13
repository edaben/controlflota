import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function inspect() {
    const tables = ['segment_rules', 'stop_rules', 'speed_zones'];
    for (const table of tables) {
        console.log(`\n--- Columns for ${table} ---`);
        try {
            const columns: any = await prisma.$queryRawUnsafe(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = '${table}'
                ORDER BY column_name
            `);
            columns.forEach((col: any) => {
                console.log(`${col.column_name}: ${col.data_type}`);
            });
        } catch (e) {
            console.error(`Error inspecting ${table}:`, e);
        }
    }
}
inspect().finally(() => prisma.$disconnect());
