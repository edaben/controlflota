import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'fs';
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
        doc.text(`Vehículo: ${fine.infraction.vehicle.plateNumber}`);
        doc.text(`Tipo: ${fine.infraction.type}`);
        doc.text(`Monto: $${fine.amountUsd.toFixed(2)} USD`);
        doc.moveDown();

        doc.fontSize(10).text('Este es un comprobante automático generado por el sistema de Control Bus.', { align: 'center', color: 'gray' });

        doc.end();

        return filePath;
    }

    /**
     * Genera un PDF consolidado para un periodo
     */
    static async generateConsolidatedPDF(reportId: string): Promise<string> {
        const report = await prisma.consolidatedReport.findUnique({
            where: { id: reportId },
            include: {
                tenant: true,
                items: true
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

        report.items.forEach((item, index) => {
            doc.fontSize(10).text(`${index + 1}. Multa: $${item.amountUsd.toFixed(2)} - Infracción ID: ${item.infractionId}`);
        });

        doc.end();
        return filePath;
    }

    static async sendEmail(tenantId: string, to: string[], subject: string, html: string, attachments: any[] = []) {
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        const smtp = (tenant?.smtpConfig as any) || {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
            fromName: process.env.SMTP_FROM_NAME,
            fromEmail: process.env.SMTP_FROM_EMAIL
        };

        const transporter = nodemailer.createTransport({
            host: smtp.host,
            port: smtp.port,
            secure: smtp.port === 465,
            auth: {
                user: smtp.user,
                pass: smtp.pass
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
