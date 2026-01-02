import { IsOptional, IsString, Matches, ValidateIf } from 'class-validator';

export class UpdateSettingsDto {
    @IsOptional()
    @IsString()
    @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, { message: 'Invalid GSTIN format' })
    company_gstin?: string;

    @IsOptional()
    @IsString()
    @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, { message: 'Invalid PAN format' })
    company_pan?: string;

    @IsOptional()
    @IsString()
    @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: 'Invalid IFSC format' })
    company_bank_ifsc?: string;

    // Allow any other string key-value pairs
    [key: string]: any;
}
