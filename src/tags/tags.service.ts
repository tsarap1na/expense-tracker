import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Tag } from './models/tag.model';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagRepository } from './tag.repository';

@Injectable()
export class TagsService {
    constructor(private readonly tagRepository: TagRepository) {}

    async create(dto: CreateTagDto): Promise<Tag> {
        const existing = await this.tagRepository.findByName(dto.name);
        if (existing) throw new ConflictException(`Tag with name "${dto.name}" already exists`);
        return this.tagRepository.create(dto);
    }

    async findAll(): Promise<Tag[]> {
        return this.tagRepository.findAll();
    }

    async findOne(id: number): Promise<Tag> {
        const tag = await this.tagRepository.findById(id);
        if (!tag) throw new NotFoundException(`Tag #${id} not found`);
        return tag;
    }

    async update(id: number, dto: UpdateTagDto): Promise<Tag> {
        const tag = await this.findOne(id);
        if (dto.name) {
            const existing = await this.tagRepository.findByName(dto.name);
            if (existing && existing.id !== id) {
                throw new ConflictException(`Tag with name "${dto.name}" already exists`);
            }
        }
        return this.tagRepository.update(tag, dto);
    }

    async remove(id: number): Promise<void> {
        const tag = await this.findOne(id);
        await this.tagRepository.delete(tag);
    }

    async findAllWithCount() {
        const rows = await this.tagRepository.findAllWithCount();
        return rows.map((r) => ({
            id: r.id,
            name: r.name,
            transactionsCount: Number(r.transactionsCount),
        }));
    }
}