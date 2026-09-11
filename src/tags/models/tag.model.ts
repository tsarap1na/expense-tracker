import {
    Column, DataType, Model, Table,
    CreatedAt, UpdatedAt, BelongsToMany,
    BelongsTo, ForeignKey
} from 'sequelize-typescript';
import { Transaction } from '@transactions/models/transaction.model';
import { TransactionTag } from './transaction-tag.model';
import { User } from '@users/models/user.model';

@Table({ tableName: 'tags',
    indexes: [
        { unique: true, fields: ['userId', 'name'], name: 'uniq_tag_user_name' },
    ], })
export class Tag extends Model {
    @Column({
        type: DataType.INTEGER, autoIncrement: true, primaryKey: true
    })
    declare id: number;

    @Column({ type: DataType.STRING(50), allowNull: false })
    declare name: string;

    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: false, onDelete: 'CASCADE' })
    declare userId: number;

    @BelongsTo(() => User)
    declare user: User;

    @BelongsToMany(() => Transaction, () => TransactionTag)
    declare transactions: Transaction[];

    @CreatedAt
    declare createdAt: Date;

    @UpdatedAt
    declare updatedAt: Date;
}