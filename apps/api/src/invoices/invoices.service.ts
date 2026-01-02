import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument = require('pdfkit');
import * as nodemailer from 'nodemailer';
import { Buffer } from 'buffer';

@Injectable()
export class InvoicesService {
    constructor(private prisma: PrismaService) { }

    // --- Email Logic ---
    private getTransporter() {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '465'),
            secure: parseInt(process.env.SMTP_PORT || '465') === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    async sendInvoiceEmail(to: string, invoiceNumber: string, pdfBuffer: Buffer) {
        const transporter = this.getTransporter();
        try {
            const info = await transporter.sendMail({
                from: `"ByteStart Technologies" <${process.env.SMTP_USER}>`,
                to,
                cc: 'info@bytestarttechnologies.com',
                subject: `Invoice #${invoiceNumber} from ByteStart Technologies`,
                html: `<p>Please find attached invoice <strong>${invoiceNumber}</strong>.</p>`,
                attachments: [
                    {
                        filename: `${invoiceNumber}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf',
                    },
                ],
            });
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Email Send Error:', error);
            throw new InternalServerErrorException('Failed to send email');
        }
    }

    // --- PDF Logic ---
    async generateInvoicePdf(invoiceId: number): Promise<Buffer> {
        const invoice = await this.prisma.invoices.findUnique({
            where: { id: invoiceId },
            include: {
                invoice_items: true,
                customers: true,
                users: true
            }
        });
        if (!invoice) throw new Error('Invoice not found');

        const settingsRows = await this.prisma.settings.findMany();
        const settings: Record<string, string> = {};
        settingsRows.forEach(r => { if (r.value) settings[r.key] = r.value });

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 40 });
            const buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // --- Header ---
            doc.fontSize(20).text(settings['company_name'] || 'Bytestart', { align: 'left' });
            doc.fontSize(10).text(settings['company_address'] || '', { align: 'left' });

            doc.fontSize(20).text('INVOICE', { align: 'right' });
            doc.fontSize(10).text(`Invoice #: ${invoice.invoice_number}`, { align: 'right' });
            doc.text(`Date: ${invoice.invoice_date ? invoice.invoice_date.toISOString().split('T')[0] : ''}`, { align: 'right' });

            doc.moveDown();

            // --- Bill To ---
            const customerName = invoice.customers?.name || invoice.users?.name || 'Guest';
            doc.text(`Bill To: ${customerName}`, 40, 200);

            // --- Table ---
            let y = 300;
            doc.text('Description', 50, y);
            doc.text('Amount', 400, y, { align: 'right' });

            y += 20;
            invoice.invoice_items.forEach(item => {
                doc.text(item.description, 50, y);
                doc.text(String(item.amount), 400, y, { align: 'right' });
                y += 20;
            });

            // --- Total ---
            y += 20;
            doc.font('Helvetica-Bold').text(`Total: ${invoice.total}`, 400, y, { align: 'right' });

            doc.end();
        });
    }

    // --- CRUD ---
    async getInvoices() {
        return this.prisma.invoices.findMany({
            orderBy: { created_at: 'desc' },
            include: { customers: true }
        });
    }
}
