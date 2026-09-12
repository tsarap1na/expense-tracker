import { ApiProperty } from '@nestjs/swagger';

export class ImportErrorDto {
    @ApiProperty({ description: 'Row number (starting from 1, header excluded)' })
    row!: number;

    @ApiProperty()
    reason!: string;
}