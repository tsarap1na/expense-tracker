import {
    Controller, Get, Post, Patch, Delete, Body, Param, Query,
    ParseIntPipe, HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RecurringService } from './recurring.service';
import { CreateRecurringDto } from './dto/create-recurring.dto';
import { UpdateRecurringDto } from './dto/update-recurring.dto';
import { QueryRecurringDto } from './dto/query-recurring.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { CurrentUser } from '@auth/decorators/current-user.decorator';

@ApiTags('recurring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recurring')
export class RecurringController {
    constructor(private readonly recurringService: RecurringService) {}

    @Post()
    @ApiOperation({ summary: 'Create recurring template' })
    create(@CurrentUser() user: { id: number }, @Body() dto: CreateRecurringDto) {
        return this.recurringService.create(user.id, dto);
    }

    @Post('generate')
    @ApiOperation({ summary: 'Manually generate due transactions for the current user (also runs automatically via BullMQ every minute)' })
    generate(@CurrentUser() user: { id: number }) {
        return this.recurringService.generate(user.id);
    }

    @Get()
    @ApiOperation({ summary: 'List recurring templates' })
    findAll(@CurrentUser() user: { id: number }, @Query() query: QueryRecurringDto) {
        return this.recurringService.findAll(user.id, query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get recurring template by id' })
    findOne(@CurrentUser() user: { id: number }, @Param('id', ParseIntPipe) id: number) {
        return this.recurringService.findOne(user.id, id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update recurring template' })
    update(
        @CurrentUser() user: { id: number },
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateRecurringDto,
    ) {
        return this.recurringService.update(user.id, id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete recurring template' })
    remove(@CurrentUser() user: { id: number }, @Param('id', ParseIntPipe) id: number) {
        return this.recurringService.remove(user.id, id);
    }
}