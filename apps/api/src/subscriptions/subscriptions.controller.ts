import { Body, Controller, Post, UseGuards, Req, Get } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('subscriptions')
export class SubscriptionsController {
    constructor(private readonly subscriptionsService: SubscriptionsService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post('create')
    async createSubscription(@Body('planId') planId: string, @Req() req: any) {
        return this.subscriptionsService.createSubscription(req.user.id, planId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('verify')
    async verifyPayment(@Body() data: any, @Req() req: any) {
        return this.subscriptionsService.verifyPayment(req.user.id, data);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('my-subscriptions')
    async getUserSubscriptions(@Req() req: any) {
        return this.subscriptionsService.getUserSubscriptions(req.user.id);
    }
}
