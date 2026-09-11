import {
    Column, DataType, Model, Table,
    CreatedAt, UpdatedAt, BelongsTo, ForeignKey
} from 'sequelize-typescript';
import { Category } from '@categories/models/category.model';
import { User } from '@users/models/user.model';

@Table({
    tableName: 'budgets',
    indexes: [
        { unique: true, fields: ['userId', 'categoryId', 'month'], name: 'uniq_budget_user_category_month' },
    ],
})
export class Budget extends Model {
    @Column({
        type: DataType.INTEGER, autoIncrement: true, primaryKey: true
    })
    declare id: number;

    @ForeignKey(() => Category)
    @Column({
        type: DataType.INTEGER, allowNull: false, onDelete: 'CASCADE'
    })
    declare categoryId: number;

    @BelongsTo(() => Category)
    declare category: Category;

    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: false, onDelete: 'CASCADE' })
    declare userId: number;

    @BelongsTo(() => User)
    declare user: User;

    @Column({
        type: DataType.DATEONLY, allowNull: false
    })
    declare month: string;

    @Column({
        type: DataType.DECIMAL(12, 2), allowNull: false
    })
    declare limitAmount: number;

    @CreatedAt
    declare createdAt: Date;

    @UpdatedAt
    declare updatedAt: Date;
}