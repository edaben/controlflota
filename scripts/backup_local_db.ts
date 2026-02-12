
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Iniciando respaldo de datos locales...');
    const MAX_RECORDS = 5000;

    const backup: any = {};

    // High priority - Core configuration
    backup.tenants = await prisma.tenant.findMany();
    console.log(`✅ Tenants: ${backup.tenants.length}`);

    backup.users = await prisma.user.findMany();
    console.log(`✅ Users: ${backup.users.length}`);

    backup.vehicles = await prisma.vehicle.findMany();
    console.log(`✅ Vehicles: ${backup.vehicles.length}`);

    backup.routes = await prisma.route.findMany();
    console.log(`✅ Routes: ${backup.routes.length}`);

    // Dependent - Geofences & Rules
    backup.stops = await prisma.stop.findMany();
    console.log(`✅ Stops: ${backup.stops.length}`);

    backup.segmentRules = await prisma.segmentRule.findMany();
    console.log(`✅ SegmentRules: ${backup.segmentRules.length}`);

    backup.stopRules = await prisma.stopRule.findMany();
    console.log(`✅ StopRules: ${backup.stopRules.length}`);

    backup.speedZones = await prisma.speedZone.findMany();
    console.log(`✅ SpeedZones: ${backup.speedZones.length}`);

    backup.reportSchedules = await prisma.reportSchedule.findMany();
    console.log(`✅ ReportSchedules: ${backup.reportSchedules.length}`);

    // Low Priority - Logs & Transactions & Events
    // Limit to most recent 5000 to keep migration fast and small
    backup.gpsEvents = await prisma.gpsEvent.findMany({ take: MAX_RECORDS, orderBy: { createdAt: 'desc' } });
    console.log(`✅ GpsEvents (Snippet): ${backup.gpsEvents.length}`);

    backup.stopArrivals = await prisma.stopArrival.findMany({ take: MAX_RECORDS, orderBy: { createdAt: 'desc' } });
    console.log(`✅ StopArrivals (Snippet): ${backup.stopArrivals.length}`);

    backup.infractions = await prisma.infraction.findMany({ take: MAX_RECORDS, orderBy: { createdAt: 'desc' } });
    console.log(`✅ Infractions (Snippet): ${backup.infractions.length}`);

    backup.fines = await prisma.fine.findMany({ take: MAX_RECORDS, orderBy: { createdAt: 'desc' } });
    console.log(`✅ Fines (Snippet): ${backup.fines.length}`);

    backup.tickets = await prisma.ticket.findMany({ take: MAX_RECORDS, orderBy: { createdAt: 'desc' } });
    console.log(`✅ Tickets (Snippet): ${backup.tickets.length}`);

    backup.consolidatedReports = await prisma.consolidatedReport.findMany({ take: MAX_RECORDS, orderBy: { createdAt: 'desc' } });
    console.log(`✅ ConsolidatedReports (Snippet): ${backup.consolidatedReports.length}`);

    backup.emailLogs = await prisma.emailLog.findMany({ take: MAX_RECORDS, orderBy: { sentAt: 'desc' } });
    console.log(`✅ EmailLogs (Snippet): ${backup.emailLogs.length}`);

    fs.writeFileSync('local_db_backup.json', JSON.stringify(backup, null, 2));
    console.log('🎉 Respaldo local guardado en local_db_backup.json');
}

main()
    .catch(e => {
        console.error('❌ Error en respaldo:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
