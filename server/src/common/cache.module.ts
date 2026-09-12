import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';

@Module({
    imports: [
        CacheModule.registerAsync({
            isGlobal: true,
            useFactory: async () => {
                const host = process.env.REDIS_HOST ?? 'localhost';
                const port = process.env.REDIS_PORT ?? '6379';

                return {
                    stores: [createKeyv(`redis://${host}:${port}`)],
                    ttl: 60_000,
                };
            },
        }),
    ],
    exports: [CacheModule],
})
export class AppCacheModule {}
