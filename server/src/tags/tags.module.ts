import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Tag } from './models/tag.model';
import { TransactionTag } from './models/transaction-tag.model';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { TagRepository } from './tag.repository';

@Module({
    imports: [SequelizeModule.forFeature([Tag, TransactionTag])],
    controllers: [TagsController],
    providers: [TagsService, TagRepository],
    exports: [TagRepository],
})
export class TagsModule {}