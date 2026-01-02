import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicService {
    constructor(private prisma: PrismaService) { }

    async getActivePlans() {
        return this.prisma.plans.findMany({
            where: { is_active: true },
            orderBy: { price_discounted: 'asc' },
        });
    }

    async getPublicSettings() {
        // Only return settings that are safe for public
        const allowedKeys = ['site_name', 'support_email', 'gstin', 'terms_and_conditions', 'privacy_policy'];
        const settings = await this.prisma.settings.findMany({
            where: {
                key: { in: allowedKeys }
            }
        });

        // Convert array to object
        return settings.reduce((acc: Record<string, string | null>, curr: any) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string | null>);
    }
}
