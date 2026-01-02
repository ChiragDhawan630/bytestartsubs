import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePlanDto {
    @IsString()
    @IsNotEmpty()
    id: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @Min(0)
    price_original: number;

    @IsNumber()
    @Min(0)
    price_discounted: number;

    @IsString()
    @IsOptional()
    billing_cycle?: string;

    @IsString()
    @IsOptional()
    features?: string; // Stored as JSON string

    @IsString()
    @IsOptional()
    razorpay_plan_id?: string;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;

    @IsNumber()
    @IsOptional()
    display_order?: number;

    @IsString()
    @IsOptional()
    category?: string;

    @IsString()
    @IsOptional()
    price_color?: string;
}
