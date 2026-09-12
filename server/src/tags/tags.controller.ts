import {
    Body, Controller, Delete, Get, Param, ParseIntPipe,
    Patch, Post, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { CurrentUser } from '@auth/decorators/current-user.decorator';

@ApiTags('tags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tags')
export class TagsController {
    constructor(private readonly tagsService: TagsService) {}

    @Post()
    create(@CurrentUser() user: { id: number }, @Body() dto: CreateTagDto) {
        return this.tagsService.create(user.id, dto);
    }

    @Get()
    findAll(@CurrentUser() user: { id: number }) {
        return this.tagsService.findAll(user.id);
    }

    @Get('stats')
    findAllWithCount(@CurrentUser() user: { id: number }) {
        return this.tagsService.findAllWithCount(user.id);
    }

    @Get(':id')
    findOne(@CurrentUser() user: { id: number }, @Param('id', ParseIntPipe) id: number) {
        return this.tagsService.findOne(user.id, id);
    }

    @Patch(':id')
    update(
        @CurrentUser() user: { id: number },
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateTagDto,
    ) {
        return this.tagsService.update(user.id, id, dto);
    }

    @Delete(':id')
    remove(@CurrentUser() user: { id: number }, @Param('id', ParseIntPipe) id: number) {
        return this.tagsService.remove(user.id, id);
    }
}