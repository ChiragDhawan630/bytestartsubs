import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    async getStats() {
        const totalUsers = await this.prisma.users.count();
        const activeSubs = await this.prisma.subscriptions.count({
            where: { status: 'active' },
        });
        // Assuming a fixed revenue calculation for now, mirroring legacy
        const revenue = activeSubs * 1000;

        return {
            totalUsers,
            activeSubs,
            revenue,
        };
    }

    async searchUsers(page: number = 1, limit: number = 50, search: string = '') {
        const skip = (page - 1) * limit;
        const whereClause = search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' as const } },
                    { email: { contains: search, mode: 'insensitive' as const } },
                ],
            }
            : {};

        const users = await this.prisma.users.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: {
                subscriptions: {
                    where: { status: 'active' },
                    select: { plan_id: true },
                },
            },
        });

        return users.map((u: any) => ({
            ...u,
            active_subs_count: u.subscriptions.length,
            active_plans: u.subscriptions.map((s: any) => s.plan_id).join(', '),
        }));
    }

    async createUser(data: any, adminId: number) { // Using any for data for now, will type properly in controller
        const existing = await this.prisma.users.findUnique({ where: { email: data.email } });
        if (existing) throw new Error('User already exists');

        const user = await this.prisma.users.create({
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                gstin: data.gstin,
                address: data.address,
                city: data.city,
                state: data.state,
                pincode: data.pincode,
                created_at: new Date(),
            },
        });

        await this.logActivity(adminId, 'admin_user_create', `Admin created user: ${data.email}`);
        return user;
    }

    async updateUser(id: number, data: any, adminId: number) {
        if (data.email) {
            const existing = await this.prisma.users.findFirst({
                where: { email: data.email, NOT: { id } },
            });
            if (existing) throw new Error('Email already in use');
        }

        const user = await this.prisma.users.update({
            where: { id },
            data,
        });

        await this.logActivity(adminId, 'admin_user_update', `Admin updated user ID ${id}`);
        return user;
    }

    async deleteUser(id: number) {
        const activeSubs = await this.prisma.subscriptions.count({
            where: { user_id: id, status: 'active' },
        });
        if (activeSubs > 0) throw new Error('Cannot delete user with active subscriptions');

        return this.prisma.users.delete({ where: { id } });
    }

    async getPlans() {
        return this.prisma.plans.findMany({
            orderBy: { display_order: 'asc' },
        });
    }

    async createPlan(data: any, adminId: number) {
        const existing = await this.prisma.plans.findUnique({ where: { id: data.id } });
        if (existing) throw new Error('Plan with this ID already exists');

        // Default to true if not defined
        const isActive = data.is_active !== undefined ? data.is_active : true;
        const priceColor = data.price_color || '#000000';
        const features = data.features || '[]'; // Expecting JSON string

        const plan = await this.prisma.plans.create({
            data: {
                id: data.id,
                name: data.name,
                price_original: data.price_original,
                price_discounted: data.price_discounted,
                billing_cycle: data.billing_cycle,
                features,
                razorpay_plan_id: data.razorpay_plan_id,
                display_order: data.display_order,
                category: data.category,
                price_color: priceColor,
                is_active: isActive,
            },
        });

        await this.logActivity(adminId, 'admin_plan_create', `Admin created plan: ${data.name}`);
        return plan;
    }

    async updatePlan(id: string, data: any, adminId: number) {
        const existing = await this.prisma.plans.findUnique({ where: { id } });
        if (!existing) throw new Error('Plan not found');

        const plan = await this.prisma.plans.update({
            where: { id },
            data: {
                name: data.name,
                price_original: data.price_original,
                price_discounted: data.price_discounted,
                billing_cycle: data.billing_cycle,
                features: data.features, // JSON string
                razorpay_plan_id: data.razorpay_plan_id,
                display_order: data.display_order,
                category: data.category,
                price_color: data.price_color,
                is_active: data.is_active,
            },
        });

        await this.logActivity(adminId, 'admin_plan_update', `Admin updated plan: ${data.name}`);
        return plan;
    }

    async deletePlan(id: string) {
        const activeSubs = await this.prisma.subscriptions.count({
            where: { plan_id: id, status: 'active' },
        });
        if (activeSubs > 0) throw new Error('Cannot delete plan with active subscriptions');

        return this.prisma.plans.delete({ where: { id } });
    }

    async getSettings() {
        const rows = await this.prisma.settings.findMany();
        const settings: Record<string, string | null> = {};
        rows.forEach((r) => {
            if (r.value !== null) settings[r.key] = r.value;
        });
        return settings;
    }

    async updateSettings(data: any, adminId: number) {
        const policyKeys = ['privacy_policy', 'terms_policy', 'refund_policy'];
        const today = new Date().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });

        policyKeys.forEach((key) => {
            if (data[key] !== undefined) data[key + '_updated'] = today;
        });

        for (const [key, value] of Object.entries(data)) {
            await this.prisma.settings.upsert({
                where: { key },
                update: { value: String(value) },
                create: { key, value: String(value) },
            });
        }

        await this.logActivity(adminId, 'admin_settings_update', 'Admin updated settings');
        return { success: true };
    }

    async getEmailTemplates() {
        return this.prisma.email_templates.findMany({
            orderBy: { name: 'asc' }
        });
    }

    async getEmailTemplate(id: string) {
        return this.prisma.email_templates.findUnique({ where: { id } });
    }

    async updateEmailTemplate(id: string, data: { subject: string; body: string }, adminId: number) {
        const template = await this.prisma.email_templates.update({
            where: { id },
            data: {
                subject: data.subject,
                body: data.body,
            },
        });

        await this.logActivity(adminId, 'update_email_template', `Updated email template: ${id}`);
        return template;
    }

    private async logActivity(userId: number, action: string, details: string) {
        await this.prisma.activity_logs.create({
            data: {
                user_id: userId,
                action,
                details,
                timestamp: new Date(),
            },
        });
    }
}
