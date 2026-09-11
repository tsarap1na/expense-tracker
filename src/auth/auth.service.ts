import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '@users/user.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TokenResponseDto } from './dto/token-response.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly jwtService: JwtService,
    ) {}

    async register(dto: RegisterDto): Promise<TokenResponseDto> {
        const existing = await this.userRepository.findByEmail(dto.email);
        if (existing) throw new ConflictException(`User with email "${dto.email}" already exists`);

        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.userRepository.create({ email: dto.email, passwordHash });

        return this.generateTokens(user.id, user.email);
    }

    async login(dto: LoginDto): Promise<TokenResponseDto> {
        const user = await this.userRepository.findByEmail(dto.email);
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

        return this.generateTokens(user.id, user.email);
    }

    async refresh(refreshToken: string): Promise<TokenResponseDto> {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
            });
            const user = await this.userRepository.findById(payload.sub);
            if (!user) throw new UnauthorizedException('User not found');

            return this.generateTokens(user.id, user.email);
        } catch {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }

    private generateTokens(userId: number, email: string): TokenResponseDto {
        const payload = { sub: userId, email };

        const accessToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_SECRET ?? 'dev-secret',
            expiresIn: '15m',
        });

        const refreshToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
            expiresIn: '7d',
        });

        return { accessToken, refreshToken };
    }
}