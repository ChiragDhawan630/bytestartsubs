import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('admin')
@UseGuards(AuthGuard('jwt'))
// TODO: Add Roles Guard to ensure only admin can access
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('stats')
    async getStats() {
        return this.adminService.getStats();
    }

    @Get('users')
    async getUsers(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '50',
        @Query('search') search: string = '',
    ) {
        return this.adminService.searchUsers(
            parseInt(page),
            parseInt(limit),
            search,
        );
    }

    @Post('users')
    async createUser(@Body() data: CreateUserDto, @Req() req: any) {
        return this.adminService.createUser(data, req.user.id);
    }

    @Put('users/:id')
    async updateUser(
        @Param('id', ParseIntPipe) id: number,
        @Body() data: UpdateUserDto,
        @Req() req: any,
    ) {
        return this.adminService.updateUser(id, data, req.user.id);
    }

    @Delete('users/:id')
    async deleteUser(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.deleteUser(id);
    }

    @Get('plans')
    async getPlans() {
        return this.adminService.getPlans();
    }

    @Post('plans')
    async createPlan(@Body() data: any, @Req() req: any) {
        return this.adminService.createPlan(data, req.user.id);
    }

    @Put('plans/:id')
    async updatePlan(
        @Param('id') id: string,
        @Body() data: any,
        @Req() req: any,
    ) {
        return this.adminService.updatePlan(id, data, req.user.id);
    }

    @Delete('plans/:id')
    async deletePlan(@Param('id') id: string) {
        return this.adminService.deletePlan(id);
    }
}
