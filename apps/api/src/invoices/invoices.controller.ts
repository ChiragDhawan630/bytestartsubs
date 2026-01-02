import { Controller, Get, Param, ParseIntPipe, Post, Res, UseGuards, Query } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Controller('invoices')
@UseGuards(AuthGuard('jwt'))
export class InvoicesController {
    constructor(private readonly invoicesService: InvoicesService) { }

    @Get()
    async getInvoices() {
        return this.invoicesService.getInvoices();
    }

    @Get(':id/download')
    async downloadInvoice(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
        const buffer = await this.invoicesService.generateInvoicePdf(id);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=invoice-${id}.pdf`,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }

    @Post(':id/send')
    async sendInvoice(@Param('id', ParseIntPipe) id: number, @Query('email') email: string) {
        if (!email) throw new Error('Email required');
        const buffer = await this.invoicesService.generateInvoicePdf(id);
        // Assume invoice number is linked to ID for demo
        return this.invoicesService.sendInvoiceEmail(email, `INV-${id}`, buffer);
    }
}
