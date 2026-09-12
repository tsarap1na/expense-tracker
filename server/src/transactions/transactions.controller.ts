import {
    Controller, Get, Post, Patch, Delete, Body, Param, Query,
    ParseIntPipe, HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { CurrentUser } from '@auth/decorators/current-user.decorator';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
    constructor(private readonly transactionsService: TransactionsService) {}

    @Post()
    create(@CurrentUser() user: { id: number }, @Body() dto: CreateTransactionDto) {
        return this.transactionsService.create(user.id, dto);
    }

    @Get()
    findAll(@CurrentUser() user: { id: number }, @Query() query: QueryTransactionDto) {
        return this.transactionsService.findAll(user.id, query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get transaction by id' })
    findOne(@CurrentUser() user: { id: number }, @Param('id', ParseIntPipe) id: number) {
        return this.transactionsService.findOne(user.id, id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update transaction' })
    update(
        @CurrentUser() user: { id: number },
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateTransactionDto,
    ) {
        return this.transactionsService.update(user.id, id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete transaction' })
    remove(@CurrentUser() user: { id: number }, @Param('id', ParseIntPipe) id: number) {
        return this.transactionsService.remove(user.id, id);
    }
}