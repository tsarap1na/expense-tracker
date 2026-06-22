import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Category } from './models/category.model';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { Transaction } from '../transactions/models/transaction.model'
import { CategoryRepository } from './category.repository';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    const existing = await this.categoryRepository.findByName(dto.name);
    if (existing) throw new ConflictException(`Category with name "${dto.name}" already exists`);
    return this.categoryRepository.create(dto);
  }

  async findAll(query: QueryCategoryDto) {
    return this.categoryRepository.findAll(query);
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) throw new NotFoundException(`Category #${id} not found`);
    return category;
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);
    return this.categoryRepository.update(category, dto);
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);
    const count = await this.categoryRepository.countTransactions(id);
    if (count > 0) throw new ConflictException('Cannot delete category with linked transactions');
    await this.categoryRepository.delete(category);
  }
}