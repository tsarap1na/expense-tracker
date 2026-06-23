import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional, Matches } from 'class-validator';

export class CreateCategoryDto {
    @ApiProperty({ example: 'Food', maxLength: 50 })
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    name!: string;

    @ApiPropertyOptional({ example: '#ffffff', description: 'HEX color' })
    @IsOptional()
    @IsString()
    @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'color must be a valid HEX color (#RRGGBB)' })
    color?: string;
}