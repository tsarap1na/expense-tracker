import {
    Column, DataType, Model, Table, 
    CreatedAt, UpdatedAt, BelongsTo,
    ForeignKey, BelongsToMany
} from 'sequelize-typescript';
import { Category } from '@categories/models/category.model';
import { TransactionType } from '@common/enums';
import { Recurring } from '@recurring/models/recurring.model';
import { Tag } from '@tags/models/tag.model';
import { TransactionTag } from '@tags/models/transaction-tag.model';

@Table({ tableName: 'transactions'})
export class Transaction extends Model {
    @Column({
        type: DataType.INTEGER, autoIncrement: true, primaryKey: true
    })
    declare id: number;

    @ForeignKey(() => Category)
    @Column({
        type: DataType.INTEGER, allowNull: false
    })
    declare categoryId: number;

    @BelongsTo(() => Category)
    declare category: Category;

    @ForeignKey(() => Recurring)
    @Column({ 
        type: DataType.INTEGER, allowNull: true 
    })
    declare recurringId: number | null;

    @BelongsTo(() => Recurring)
    declare recurring: Recurring;

    @BelongsToMany(() => Tag, () => TransactionTag)
    declare tags: Tag[];

    @Column({
        type: DataType.DECIMAL(12, 2), allowNull: false
    })
    declare amount: number;

    @Column({
        type: DataType.ENUM(...Object.values(TransactionType)), allowNull: false
    })
    declare type: TransactionType;

    @Column({
        type: DataType.STRING(255), defaultValue: ''
    })
    declare description: string;

    @Column({
        type: DataType.DATE
    })
    declare date: Date;

    @CreatedAt
    declare createdAt: Date;

    @UpdatedAt
    declare updatedAt: Date;
}