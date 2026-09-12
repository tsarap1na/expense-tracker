import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Category } from './models/category.model';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { CategoryRepository } from './category.repository';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async create(userId: number, dto: CreateCategoryDto): Promise<Category> {
    const existing = await this.categoryRepository.findByName(userId, dto.name);
    if (existing) throw new ConflictException(`Category with name "${dto.name}" already exists`);
    return this.categoryRepository.create(userId, dto);
  }

  async findAll(userId: number, query: QueryCategoryDto) {
    return this.categoryRepository.findAll(userId, query);
  }

  async findOne(userId: number, id: number): Promise<Category> {
    const category = await this.categoryRepository.findById(userId, id);
    if (!category) throw new NotFoundException(`Category #${id} not found`);
    return category;
  }

  async update(userId: number, id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(userId, id);
    return this.categoryRepository.update(category, dto);
  }

  async remove(userId: number, id: number): Promise<void> {
    const category = await this.findOne(userId, id);
    const count = await this.categoryRepository.countTransactions(userId, id);
    if (count > 0) throw new ConflictException('Cannot delete category with linked transactions');
    await this.categoryRepository.delete(category);
  }
}