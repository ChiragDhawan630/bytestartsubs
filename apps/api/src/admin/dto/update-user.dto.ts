import { PartialType } from '@nestjs/mapped-types'; // NestJS mapped-types (need to install if not present, usually is with create-nestjs-app or can use @nestjs/swagger)
// Actually, let's use check if mapped-types is there. If not, just extend manually or use IsOptional on all.
// NestJS CLI usually installs these. Let's assume standard class-validator approach for now.
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    gstin?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    city?: string;

    @IsString()
    @IsOptional()
    state?: string;

    @IsString()
    @IsOptional()
    pincode?: string;
}
