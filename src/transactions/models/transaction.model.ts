import {
    Column, DataType, Model, Table, 
    CreatedAt, UpdatedAt, BelongsTo,
    ForeignKey
} from 'sequelize-typescript';
import { Category } from '../../categories/models/category.model';

export enum TransactionType {
    expense = 'expense',
    income = 'income',
}

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