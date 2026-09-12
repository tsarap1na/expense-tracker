import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './models/user.model';

@Injectable()
export class UserRepository {
    constructor(
        @InjectModel(User) private readonly userModel: typeof User,
    ) {}

    async create(data: { email: string; passwordHash: string }): Promise<User> {
        return this.userModel.create(data);
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.userModel.findOne({ where: { email } });
    }

    async findById(id: number): Promise<User | null> {
        return this.userModel.findByPk(id);
    }
}