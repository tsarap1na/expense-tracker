import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRepository } from '@users/user.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly userRepository: UserRepository) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET ?? 'dev-secret',
        });
    }

    async validate(payload: { sub: number; email: string }) {
        const user = await this.userRepository.findById(payload.sub);
        if (!user) throw new UnauthorizedException('User not found');
        return { id: user.id, email: user.email };
    }
}