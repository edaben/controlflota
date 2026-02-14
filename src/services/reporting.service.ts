import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ReportingService {
    /**
     * Genera un PDF individual para una multa
     */
    static async generateTicketPDF(fineId: string): Promise<string> {
        const fine = await prisma.fine.findUnique({
            where: { id: fineId },
            include: {
                infraction: { include: { vehicle: true } },
                tenant: true
            }
        });

        if (!fine) throw new Error('Fine not found');

        const doc = new PDFDocument({ margin: 50 });
        const fileName = `ticket_${fine.id}.pdf`;
        const filePath = `./uploads/tickets/${fileName}`;

        // Asegurar directorio
        if (!fs.existsSync('./uploads/tickets')) {
            fs.mkdirSync('./uploads/tickets', { recursive: true });
        }

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header
        doc.fontSize(20).text('RECIBO DE INFRACCIÓN', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Cliente: ${fine.tenant.name}`);
        doc.text(`Fecha: ${fine.createdAt.toLocaleString()}`);
        doc.moveDown();

        // Detalle
        doc.text(`Vehículo: ${fine.infraction.vehicle.plate}`);
        doc.text(`Tipo: ${fine.infraction.type}`);
        doc.text(`Monto: $${fine.amountUsd.toFixed(2)} USD`);
        doc.moveDown();

        doc.fontSize(10).fillColor('gray').text('Este es un comprobante automático generado por el sistema de Control Bus.', { align: 'center' });

        doc.end();

        return filePath;
    }

    /**
     * Genera un PDF consolidado para un periodo
     */
    static async generateConsolidatedPDF(reportId: string): Promise<string> {
        const report: any = await prisma.consolidatedReport.findUnique({
            where: { id: reportId },
            include: {
                tenant: true,
                items: {
                    include: {
                        vehicle: true
                    }
                }
            }
        });

        if (!report) throw new Error('Report not found');

        const doc = new PDFDocument({ margin: 50 });
        const fileName = `consolidado_${report.id}.pdf`;
        const filePath = `./uploads/reports/${fileName}`;

        if (!fs.existsSync('./uploads/reports')) {
            fs.mkdirSync('./uploads/reports', { recursive: true });
        }

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Diseño tipo Estado de Cuenta
        doc.fontSize(20).text('REPORTE CONSOLIDADO DE MULTAS', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Empresa: ${report.tenant.name}`);
        doc.text(`Periodo: ${report.periodStart.toLocaleDateString()} al ${report.periodEnd.toLocaleDateString()}`);
        doc.moveDown();

        // Resumen
        doc.fontSize(14).text('Resumen General', { underline: true });
        doc.fontSize(12).text(`Total Multas: ${report.items.length}`);
        doc.text(`Total a Pagar: $${report.totalUsd.toFixed(2)} USD`);
        doc.moveDown();

        // Tabla de detalle (Simple)
        doc.fontSize(12).text('Detalle por Vehículo:', { underline: true });
        doc.moveDown(0.5);

        report.items.forEach((item: any, index: number) => {
            const vehicleInfo = item.vehicle ? `[${item.vehicle.plate}] ${item.vehicle.ownerName || ''}` : `ID: ${item.vehicleId}`;
            doc.fontSize(10).text(`${index + 1}. ${vehicleInfo} - Multa: $${item.amountUsd.toFixed(2)}`);
        });

        doc.end();
        return filePath;
    }

    static async sendEmail(tenantId: string, to: string[], subject: string, html: string, attachments: any[] = []) {
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

        // Determinar qué configuración usar: Tenant o Sistema (.env)
        // Usamos la del tenant SOLO si tiene los campos críticos definidos
        const useTenantSmtp = tenant?.smtpHost && tenant?.smtpUser && tenant?.smtpPassword;

        const smtp = useTenantSmtp ? {
            host: tenant.smtpHost,
            port: tenant.smtpPort || 587,
            user: tenant.smtpUser,
            pass: tenant.smtpPassword,
            fromName: tenant.smtpFromName || 'Control Bus',
            fromEmail: tenant.smtpFromEmail || tenant.smtpUser,
            secure: tenant.smtpSecure
        } : {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
            fromName: process.env.SMTP_FROM_NAME || 'Control Bus',
            fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
            secure: process.env.SMTP_SECURE === 'true'
        };

        if (!smtp.host) {
            throw new Error('SMTP configuration missing (No tenant settings and no system defaults)');
        }

        const transporter = nodemailer.createTransport({
            host: smtp.host,
            port: smtp.port as number,
            secure: smtp.secure,
            auth: {
                user: smtp.user as string,
                pass: smtp.pass as string
            },
            tls: {
                rejectUnauthorized: false // Para mayor compatibilidad con servidores locales/privados
            }
        });

        try {
            await transporter.sendMail({
                from: `"${smtp.fromName}" <${smtp.fromEmail}>`,
                to: to.join(', '),
                subject,
                html,
                attachments
            });

            await prisma.emailLog.create({
                data: {
                    tenantId,
                    toEmail: to.join(', '),
                    subject,
                    status: 'SENT'
                }
            });
        } catch (error: any) {
            await prisma.emailLog.create({
                data: {
                    tenantId,
                    toEmail: to.join(', '),
                    subject,
                    status: 'ERROR',
                    errorMessage: error.message
                }
            });
            throw error;
        }
    }
}
