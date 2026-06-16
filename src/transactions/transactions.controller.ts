import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
    constructor(private readonly transactionsService: TransactionsService) {}

    @Post()
    @ApiOperation({ summary: 'Create transaction' })
    create(@Body() dto: CreateTransactionDto) {
        return this.transactionsService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'List transactions with filters, pagination, sort' })
    findAll(@Query() query: QueryTransactionDto) {
        return this.transactionsService.findAll(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get transaction by id' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.transactionsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update transaction' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTransactionDto) {
        return this.transactionsService.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete transaction' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.transactionsService.remove(id);
    }
}