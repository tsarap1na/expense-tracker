import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Tag } from './models/tag.model';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagRepository } from './tag.repository';

@Injectable()
export class TagsService {
    constructor(private readonly tagRepository: TagRepository) {}

    async create(userId: number, dto: CreateTagDto): Promise<Tag> {
        const existing = await this.tagRepository.findByName(userId, dto.name);
        if (existing) throw new ConflictException(`Tag with name "${dto.name}" already exists`);
        return this.tagRepository.create(userId, dto);
    }

    async findAll(userId: number): Promise<Tag[]> {
        return this.tagRepository.findAll(userId);
    }

    async findOne(userId: number, id: number): Promise<Tag> {
        const tag = await this.tagRepository.findById(userId, id);
        if (!tag) throw new NotFoundException(`Tag #${id} not found`);
        return tag;
    }

    async update(userId: number, id: number, dto: UpdateTagDto): Promise<Tag> {
        const tag = await this.findOne(userId, id);
        if (dto.name) {
            const existing = await this.tagRepository.findByName(userId, dto.name);
            if (existing && existing.id !== id) {
                throw new ConflictException(`Tag with name "${dto.name}" already exists`);
            }
        }
        return this.tagRepository.update(tag, dto);
    }

    async remove(userId: number, id: number): Promise<void> {
        const tag = await this.findOne(userId, id);
        await this.tagRepository.delete(tag);
    }

    async findAllWithCount(userId: number) {
        const rows = await this.tagRepository.findAllWithCount(userId);
        return rows.map((r) => ({
            id: r.id,
            name: r.name,
            transactionsCount: Number(r.transactionsCount),
        }));
    }
}