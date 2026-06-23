import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from './models/transaction.model';
import { Category } from '../categories/models/category.model';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { TransactionRepository } from './transaction.repository';

@Injectable()
export class TransactionsService {
    constructor(
        private readonly transactionRepository: TransactionRepository,
        @InjectModel(Category) private readonly categoryModel: typeof Category,
    ) {}

    async create(dto: CreateTransactionDto): Promise<Transaction> {
        const category = await this.categoryModel.findByPk(dto.categoryId);
        if (!category) throw new BadRequestException(`Category #${dto.categoryId} not found`);
        return this.transactionRepository.create({
            ...dto,
            date: new Date(dto.date),
        });
    }

    async findAll(query: QueryTransactionDto) {
        return this.transactionRepository.findAll(query);
    }

    async findOne(id: number): Promise<Transaction> {
        const transaction = await this.transactionRepository.findById(id);
        if (!transaction) throw new NotFoundException(`Transaction #${id} not found`);
        return transaction;
    }

    async update(id: number, dto: UpdateTransactionDto): Promise<Transaction> {
        const transaction = await this.findOne(id);
        if (dto.categoryId) {
            const category = await this.categoryModel.findByPk(dto.categoryId);
            if (!category) throw new BadRequestException(`Category #${dto.categoryId} not found`);
        }
        return this.transactionRepository.update(transaction, dto as Partial<Transaction>);
    }

    async remove(id: number): Promise<void> {
        const transaction = await this.findOne(id);
        await this.transactionRepository.delete(transaction);
    }
}