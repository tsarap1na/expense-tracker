import {
    Column, DataType, Model, Table, ForeignKey
} from 'sequelize-typescript';
import { Transaction } from '@transactions/models/transaction.model';
import { Tag } from './tag.model';

@Table({
    tableName: 'transaction_tags',
    timestamps: false,
    indexes: [
        { unique: true, fields: ['transactionId', 'tagId'], name: 'uniq_transaction_tag' },
    ],
})
export class TransactionTag extends Model {
    @ForeignKey(() => Transaction)
    @Column({ type: DataType.INTEGER, allowNull: false, onDelete: 'CASCADE' })
    declare transactionId: number;

    @ForeignKey(() => Tag)
    @Column({ type: DataType.INTEGER, allowNull: false, onDelete: 'CASCADE' })
    declare tagId: number;
}