import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { RecurringService } from './recurring.service';
import { RECURRING_GENERATE_JOB, RECURRING_QUEUE } from './recurring.constants';

@Processor(RECURRING_QUEUE)
export class RecurringProcessor extends WorkerHost {
    private readonly logger = new Logger(RecurringProcessor.name);

    constructor(private readonly recurringService: RecurringService) {
        super();
    }

    async process(job: Job): Promise<{ count: number }> {
        if (job.name !== RECURRING_GENERATE_JOB) {
            return { count: 0 };
        }

        const result = await this.recurringService.generateDue();
        if (result.count > 0) {
            this.logger.log(`Generated ${result.count} recurring transaction(s)`);
        }
        return result;
    }
}
