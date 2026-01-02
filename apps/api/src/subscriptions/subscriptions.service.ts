import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Razorpay = require('razorpay');
// crypto is builtin Node module
import * as crypto from 'crypto';

@Injectable()
export class SubscriptionsService {
    private razorpay: any;

    constructor(private prisma: PrismaService) {
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    }


    async getUserSubscriptions(userId: number) {
        return this.prisma.subscriptions.findMany({
            where: { user_id: userId },
            include: { invoices: true }
        });
    }

    async createSubscription(userId: number, planId: string) {
        // 1. Get Plan Details from DB
        const plan = await this.prisma.plans.findUnique({ where: { id: planId } });
        if (!plan) throw new Error('Plan not found');
        if (!plan.razorpay_plan_id) throw new Error('Razorpay Plan ID missing for this plan');

        try {
            // 2. Create Razorpay Subscription
            // expiry set to 10 years from now approximately, or just let Razorpay handle defaults
            const subscription = await this.razorpay.subscriptions.create({
                plan_id: plan.razorpay_plan_id,
                total_count: 120, // Max cycles, e.g., 10 years monthly
                quantity: 1,
                customer_notify: 1,
                addons: [],
                notes: {
                    internal_user_id: userId,
                    internal_plan_id: planId
                }
            });

            return {
                subscription_id: subscription.id,
                key_id: process.env.RAZORPAY_KEY_ID,
                plan_name: plan.name,
                amount: plan.price_discounted,
                currency: 'INR'
            };
        } catch (error) {
            console.error('Razorpay Create Sub Error', error);
            throw new InternalServerErrorException('Failed to create subscription with payment provider');
        }
    }

    async verifyPayment(userId: number, data: { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string }) {
        const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = data;

        // 1. Verify Signature
        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
            .update(razorpay_payment_id + '|' + razorpay_subscription_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            throw new Error('Invalid payment signature');
        }

        // 2. Fetch Subscription details from Razorpay to get start/end dates
        // Note: In a real webhook scenario we would get this data pushed, 
        // but here we might need to fetch it or just record the success immediately.
        // For now, let's fetch it to be robust.
        const rzSub = await this.razorpay.subscriptions.fetch(razorpay_subscription_id);

        // 3. Find Internal Plan ID from notes (stuck in notes during create) or pass it from frontend
        // If notes are not reliable, we need to lookup based on rzSub.plan_id
        const plan = await this.prisma.plans.findFirst({
            where: { razorpay_plan_id: rzSub.plan_id }
        });

        if (!plan) throw new Error('Matched internal plan not found');

        // 4. Create/Update Local Subscription
        // Check if user already has a sub? Or allow multiples?
        // Legacy logic seemed to allow creating new ones.

        const startDate = new Date(rzSub.start_at ? rzSub.start_at * 1000 : Date.now());
        const endDate = new Date(rzSub.end_at ? rzSub.end_at * 1000 : Date.now() + 30 * 24 * 60 * 60 * 1000); // Fallback

        // Create subscription record
        const newSub = await this.prisma.subscriptions.create({
            data: {
                user_id: userId,
                plan_id: plan.id,
                razorpay_sub_id: razorpay_subscription_id,
                status: 'active',
                start_date: startDate,
                renewal_date: endDate, // Using endDate as renewal date
            }
        });

        // Log Activity
        await this.prisma.activity_logs.create({
            data: {
                user_id: userId,
                action: 'subscription_created',
                details: `User subscribed to ${plan.name} (${razorpay_subscription_id})`,
                timestamp: new Date()
            }
        });

        return { success: true, subscription: newSub };
    }
}
