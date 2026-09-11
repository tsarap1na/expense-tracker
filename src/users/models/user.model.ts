import {
    Column, DataType, Model, Table,
    CreatedAt, UpdatedAt
} from 'sequelize-typescript';

@Table({ tableName: 'users' })
export class User extends Model {
    @Column({
        type: DataType.INTEGER, autoIncrement: true, primaryKey: true
    })
    declare id: number;

    @Column({
        type: DataType.STRING(255), allowNull: false, unique: true
    })
    declare email: string;

    @Column({
        type: DataType.STRING(255), allowNull: false
    })
    declare passwordHash: string;

    @CreatedAt
    declare createdAt: Date;

    @UpdatedAt
    declare updatedAt: Date;
}