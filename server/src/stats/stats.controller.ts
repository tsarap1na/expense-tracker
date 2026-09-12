import { Controller, Get, Query, DefaultValuePipe, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiQuery, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { CategoryReportQueryDto } from './dto/category-report-query.dto';
import { PeriodQueryDto } from './dto/period-query.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { CurrentUser } from '@auth/decorators/current-user.decorator';

@ApiTags('stats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stats')
export class StatsController {
    constructor(private readonly statsService: StatsService) {}

    @Get('by-category')
    @ApiOperation({ summary: 'Breakdown of income/expense by category for a period' })
    getCategoryReport(@CurrentUser() user: { id: number }, @Query() query: CategoryReportQueryDto) {
        return this.statsService.getCategoryReport(user.id, query);
    }

    @Get('monthly')
    @ApiOperation({ summary: 'Monthly income/expense dynamics for the last N months' })
    @ApiQuery({ name: 'months', required: false, example: 6 })
    getMonthlyDynamics(
        @CurrentUser() user: { id: number },
        @Query('months', new DefaultValuePipe(6), ParseIntPipe) months: number,
    ) {
        return this.statsService.getMonthlyDynamics(user.id, months);
    }

    @Get('top-categories')
    @ApiOperation({ summary: 'Top-5 categories by expense for a period' })
    getTopCategories(@CurrentUser() user: { id: number }, @Query() query: PeriodQueryDto) {
        return this.statsService.getTopCategories(user.id, query, 5);
    }
}