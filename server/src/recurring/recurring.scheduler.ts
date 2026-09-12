import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
    RECURRING_GENERATE_INTERVAL_MS,
    RECURRING_GENERATE_JOB,
    RECURRING_QUEUE,
} from './recurring.constants';

@Injectable()
export class RecurringScheduler implements OnModuleInit {
    constructor(@InjectQueue(RECURRING_QUEUE) private readonly queue: Queue) {}

    async onModuleInit() {
        await this.queue.upsertJobScheduler(
            RECURRING_GENERATE_JOB,
            { every: RECURRING_GENERATE_INTERVAL_MS },
            {
                name: RECURRING_GENERATE_JOB,
                data: {},
                opts: {
                    removeOnComplete: true,
                    removeOnFail: 50,
                },
            },
        );
    }
}
