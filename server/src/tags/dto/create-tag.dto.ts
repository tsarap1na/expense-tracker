import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateTagDto {
    @ApiProperty({ example: 'Food' })
    @IsString()
    @Length(2, 50)
    name!: string;
}