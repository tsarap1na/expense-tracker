import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RecurringService } from './recurring.service';
import { CreateRecurringDto } from './dto/create-recurring.dto';
import { UpdateRecurringDto } from './dto/update-recurring.dto';
import { QueryRecurringDto } from './dto/query-recurring.dto';

@ApiTags('recurring')
@Controller('recurring')
export class RecurringController {
    constructor(private readonly recurringService: RecurringService) {}

    @Post()
    @ApiOperation({ summary: 'Create recurring template' })
    create(@Body() dto: CreateRecurringDto) {
        return this.recurringService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'List recurring templates' })
    findAll(@Query() query: QueryRecurringDto) {
        return this.recurringService.findAll(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get recurring template by id' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.recurringService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update recurring template' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRecurringDto) {
        return this.recurringService.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete recurring template' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.recurringService.remove(id);
    }

    @Post('generate')
    @ApiOperation({ summary: 'Generate transactions from active recurring templates' })
    generate() {
        return this.recurringService.generate();
    }
}