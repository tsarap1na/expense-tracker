import {
    Column, DataType, Model, Table, 
    HasMany, CreatedAt, UpdatedAt,
} from 'sequelize-typescript';
import { Transaction } from '../../transactions/models/transaction.model';

@Table({tableName: 'categories'})
export class Category extends Model {
    @Column({
        type: DataType.INTEGER, autoIncrement: true, primaryKey: true
    })
    declare id: number;

    @Column({
        type: DataType.STRING(50), unique: true, allowNull: false
    })
    declare name: string;

    @Column({
        type: DataType.STRING(7), allowNull: false
    })
    declare color: string;

    @CreatedAt
    declare createdAt: Date;

    @UpdatedAt
    declare updatedAt: Date;

    @HasMany(() => Transaction)
    declare transactions: Transaction[];

}
