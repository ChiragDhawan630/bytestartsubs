import { Controller, Get } from '@nestjs/common';
import { PublicService } from './public.service';

@Controller('public')
export class PublicController {
    constructor(private readonly publicService: PublicService) { }

    @Get('plans')
    getPlans() {
        return this.publicService.getActivePlans();
    }

    @Get('settings')
    getSettings() {
        return this.publicService.getPublicSettings();
    }
}
