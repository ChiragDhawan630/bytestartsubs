import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, users } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findByEmail(email: string): Promise<users | null> {
        return this.prisma.users.findUnique({
            where: { email },
        });
    }

    async findById(id: number): Promise<users | null> {
        return this.prisma.users.findUnique({ where: { id } });
    }

    async create(data: Prisma.usersCreateInput): Promise<users> {
        return this.prisma.users.create({ data });
    }

    async update(id: number, data: Prisma.usersUpdateInput): Promise<users> {
        return this.prisma.users.update({ where: { id }, data });
    }
}
