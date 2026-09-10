import {
    Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { QueryBudgetDto } from './dto/query-budget.dto';

@ApiTags('budgets')
@Controller('budgets')
export class BudgetsController {
    constructor(private readonly budgetsService: BudgetsService) {}

    @Post()
    create(@Body() dto: CreateBudgetDto) {
        return this.budgetsService.create(dto);
    }

    @Get()
    findAll(@Query() query: QueryBudgetDto) {
        return this.budgetsService.findAll(query.month);
    }

    @Get('summary')
    @ApiOperation({ summary: 'Get budgets summary for a given month' })
    getSummary(@Query() query: QueryBudgetDto) {
        return this.budgetsService.getSummary(query.month!);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.budgetsService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBudgetDto) {
        return this.budgetsService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.budgetsService.remove(id);
    }
}