import {
    Column, DataType, Model, Table, 
    HasMany, CreatedAt, UpdatedAt,
    ForeignKey, BelongsTo
} from 'sequelize-typescript';
import { Transaction } from '@transactions/models/transaction.model';
import { User } from '@users/models/user.model';

@Table({
    tableName: 'categories',
    indexes: [
        { unique: true, fields: ['userId', 'name'], name: 'uniq_category_user_name' },
    ],
})
export class Category extends Model {
    @Column({
        type: DataType.INTEGER, autoIncrement: true, primaryKey: true
    })
    declare id: number;

    @Column({
        type: DataType.STRING(50), allowNull: false
    })
    declare name: string;

    @Column({
        type: DataType.STRING(7), allowNull: false
    })
    declare color: string;

    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: false, onDelete: 'CASCADE' })
    declare userId: number;

    @BelongsTo(() => User)
    declare user: User;

    @CreatedAt
    declare createdAt: Date;

    @UpdatedAt
    declare updatedAt: Date;

    @HasMany(() => Transaction)
    declare transactions: Transaction[];
}