import {
    Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { QueryBudgetDto } from './dto/query-budget.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { CurrentUser } from '@auth/decorators/current-user.decorator';

@ApiTags('budgets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetsController {
    constructor(private readonly budgetsService: BudgetsService) {}

    @Post()
    create(@CurrentUser() user: { id: number }, @Body() dto: CreateBudgetDto) {
        return this.budgetsService.create(user.id, dto);
    }

    @Get()
    findAll(@CurrentUser() user: { id: number }, @Query() query: QueryBudgetDto) {
        return this.budgetsService.findAll(user.id, query.month);
    }

    @Get('summary')
    @ApiOperation({ summary: 'Get budgets summary for a given month' })
    getSummary(@CurrentUser() user: { id: number }, @Query() query: QueryBudgetDto) {
        return this.budgetsService.getSummary(user.id, query.month!);
    }

    @Get(':id')
    findOne(@CurrentUser() user: { id: number }, @Param('id', ParseIntPipe) id: number) {
        return this.budgetsService.findOne(user.id, id);
    }

    @Patch(':id')
    update(
        @CurrentUser() user: { id: number },
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateBudgetDto,
    ) {
        return this.budgetsService.update(user.id, id, dto);
    }

    @Delete(':id')
    remove(@CurrentUser() user: { id: number }, @Param('id', ParseIntPipe) id: number) {
        return this.budgetsService.remove(user.id, id);
    }
}