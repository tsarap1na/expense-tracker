import { Controller, Get, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiQuery, ApiOperation } from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { CategoryReportQueryDto } from './dto/category-report-query.dto';
import { PeriodQueryDto } from './dto/period-query.dto';

@ApiTags('stats')
@Controller('stats')
export class StatsController {
    constructor(private readonly statsService: StatsService) {}

    @Get('by-category')
    @ApiOperation({ summary: 'Breakdown of income/expense by category for a period' })
    getCategoryReport(@Query() query: CategoryReportQueryDto) {
        return this.statsService.getCategoryReport(query);
    }

    @Get('monthly')
    @ApiOperation({ summary: 'Monthly income/expense dynamics for the last N months' })
    @ApiQuery({ name: 'months', required: false, example: 6 })
    getMonthlyDynamics(@Query('months', new DefaultValuePipe(6), ParseIntPipe) months: number) {
        return this.statsService.getMonthlyDynamics(months);
    }

    @Get('top-categories')
    @ApiOperation({ summary: 'Top-5 categories by expense for a period' })
    getTopCategories(@Query() query: PeriodQueryDto) {
        return this.statsService.getTopCategories(query, 5);
    }
}