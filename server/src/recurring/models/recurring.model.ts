import {
    Column, DataType, Model, Table, ForeignKey, BelongsTo, CreatedAt, UpdatedAt
} from 'sequelize-typescript';
import { Category } from '@categories/models/category.model';
import { TransactionType } from '@common/enums';
import { User } from '@users/models/user.model';

export enum Frequency {
    day = 'day',
    week = 'week',
    month = 'month',
}

@Table({ tableName: 'recurrings' })
export class Recurring extends Model {
    @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
    declare id: number;

    @ForeignKey(() => Category)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare categoryId: number;

    @BelongsTo(() => Category)
    declare category: Category;

    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: false, onDelete: 'CASCADE' })
    declare userId: number;

    @BelongsTo(() => User)
    declare user: User;

    @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
    declare amount: number;

    @Column({ type: DataType.ENUM(...Object.values(TransactionType)), allowNull: false })
    declare type: TransactionType;

    @Column({ type: DataType.STRING(255), defaultValue: '' })
    declare description: string;

    @Column({ type: DataType.ENUM(...Object.values(Frequency)), allowNull: false })
    declare frequency: Frequency;

    @Column({ type: DataType.DATE, allowNull: false })
    declare nextRunAt: Date;

    @Column({ type: DataType.BOOLEAN, defaultValue: true })
    declare isActive: boolean;

    @CreatedAt declare createdAt: Date;
    @UpdatedAt declare updatedAt: Date;
}