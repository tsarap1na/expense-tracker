import {
    Column, DataType, Model, Table,
    CreatedAt, UpdatedAt, BelongsToMany
} from 'sequelize-typescript';
import { Transaction } from '@transactions/models/transaction.model';
import { TransactionTag } from './transaction-tag.model';

@Table({ tableName: 'tags' })
export class Tag extends Model {
    @Column({
        type: DataType.INTEGER, autoIncrement: true, primaryKey: true
    })
    declare id: number;

    @Column({
        type: DataType.STRING(50), allowNull: false, unique: true
    })
    declare name: string;

    @BelongsToMany(() => Transaction, () => TransactionTag)
    declare transactions: Transaction[];

    @CreatedAt
    declare createdAt: Date;

    @UpdatedAt
    declare updatedAt: Date;
}