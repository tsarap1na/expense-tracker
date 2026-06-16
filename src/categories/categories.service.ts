import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Category } from './models/category.model';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';

@Injectable()
export class CategoriesService {
  constructor(@InjectModel(Category) private readonly categoryModel: typeof Category) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    return this.categoryModel.create({ ...dto });
  }

  async findAll(query: QueryCategoryDto) {
    const { page = 1, limit = 20, search, sortBy = 'name', sortOrder = 'asc' } = query;
    const offset = (page - 1) * limit;

    const where = search ? { name: { [Op.iLike]: `%${search}%` } } : {};

    const { rows: data, count: total } = await this.categoryModel.findAndCountAll({
      where,
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit,
      offset,
    });

    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryModel.findByPk(id);
    if (!category) throw new NotFoundException(`Category #${id} not found`);
    return category;
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);
    return category.update(dto);
  }

  async remove(id: number): Promise<void> {
    const category = await this.categoryModel.findByPk(id, { include: ['transactions'] });
    if (!category) throw new NotFoundException(`Category #${id} not found`);
    if (category.transactions?.length > 0) {
      throw new ConflictException('Cannot delete category with linked transactions');
    }
    await category.destroy();
  }
}