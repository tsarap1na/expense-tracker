import { BadRequestException } from '@nestjs/common';

export function validateDateRange(dateFrom?: string, dateTo?: string): void {
    if (dateFrom && dateTo && new Date(dateTo).getTime() < new Date(dateFrom).getTime()) {
        throw new BadRequestException('dateTo must be greater than or equal to dateFrom');
    }
}