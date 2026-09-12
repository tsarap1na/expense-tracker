import {
    Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { CurrentUser } from '@auth/decorators/current-user.decorator';

@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@CurrentUser() user: { id: number }, @Body() dto: CreateCategoryDto) {
      return this.categoriesService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: { id: number }, @Query() query: QueryCategoryDto) {
      return this.categoriesService.findAll(user.id, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: { id: number }, @Param('id', ParseIntPipe) id: number) {
      return this.categoriesService.findOne(user.id, id);
  }

  @Patch(':id')
  update(
      @CurrentUser() user: { id: number },
      @Param('id', ParseIntPipe) id: number,
      @Body() dto: UpdateCategoryDto,
  ) {
      return this.categoriesService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { id: number }, @Param('id', ParseIntPipe) id: number) {
      return this.categoriesService.remove(user.id, id);
  }
}