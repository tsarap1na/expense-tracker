import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/sequelize';
import { Transaction } from '@transactions/models/transaction.model';
import { Category } from '@categories/models/category.model';
import { Budget } from '@budgets/models/budget.model';
import { Tag } from '@tags/models/tag.model';

describe('Expense Tracker (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(async () => {
        await app.get(getModelToken(Transaction)).destroy({ where: {}, truncate: { cascade: true } });
        await app.get(getModelToken(Budget)).destroy({ where: {}, truncate: { cascade: true } });
        await app.get(getModelToken(Tag)).destroy({ where: {}, truncate: { cascade: true } });
        await app.get(getModelToken(Category)).destroy({ where: {}, truncate: { cascade: true } });
    });

    it('creates a category, a transaction with tags and gets the correct summary', async () => {
        const categoryRes = await request(app.getHttpServer())
            .post('/categories')
            .send({ name: 'Food', color: '#FF0000' })
            .expect(201);

        const tagRes = await request(app.getHttpServer())
            .post('/tags')
            .send({ name: 'lunch' })
            .expect(201);

        const txRes = await request(app.getHttpServer())
            .post('/transactions')
            .send({
                categoryId: categoryRes.body.id,
                amount: 1500,
                type: 'expense',
                description: 'Cafe',
                date: '2026-09-01',
                tagIds: [tagRes.body.id],
            })
            .expect(201);

        expect(txRes.body.data.tags).toHaveLength(1);

        const summaryRes = await request(app.getHttpServer())
            .get('/summary?dateFrom=2026-09-01&dateTo=2026-09-30')
            .expect(200);

        expect(summaryRes.body.totalExpense ?? summaryRes.body.expense).toBe(1500);
    });

    it('filters transactions by tagIds without duplicates', async () => {
        const categoryRes = await request(app.getHttpServer())
            .post('/categories').send({ name: 'Transport', color: '#00FF00' }).expect(201);
        const tag1 = await request(app.getHttpServer()).post('/tags').send({ name: 'taxi' }).expect(201);
        const tag2 = await request(app.getHttpServer()).post('/tags').send({ name: 'urgent' }).expect(201);

        await request(app.getHttpServer())
            .post('/transactions')
            .send({
                categoryId: categoryRes.body.id, amount: 500, type: 'expense', date: '2026-09-01',
                tagIds: [tag1.body.id, tag2.body.id],
            })
            .expect(201);

        const listRes = await request(app.getHttpServer())
            .get(`/transactions?tagIds=${tag1.body.id}`)
            .expect(200);

        expect(listRes.body.total).toBe(1);
    });

    it('returns budgetWarning when the budget limit is exceeded', async () => {
        const categoryRes = await request(app.getHttpServer())
            .post('/categories').send({ name: 'Entertainment', color: '#0000FF' }).expect(201);
        const categoryId = categoryRes.body.id;

        await request(app.getHttpServer())
            .post('/budgets')
            .send({ categoryId, month: '2026-09', limitAmount: 1000 })
            .expect(201);

        const firstRes = await request(app.getHttpServer())
            .post('/transactions')
            .send({ categoryId, amount: 600, type: 'expense', date: '2026-09-05' })
            .expect(201);
        expect(firstRes.body.budgetWarning).toBeUndefined();

        const secondRes = await request(app.getHttpServer())
            .post('/transactions')
            .send({ categoryId, amount: 500, type: 'expense', date: '2026-09-06' })
            .expect(201);
        expect(secondRes.body.budgetWarning).toBeDefined();
        expect(secondRes.body.budgetWarning.spent).toBe(1100);
    });

    it('does not allow creating a second budget for the same category and month', async () => {
        const categoryRes = await request(app.getHttpServer())
            .post('/categories').send({ name: 'Health', color: '#AA00AA' }).expect(201);

        await request(app.getHttpServer())
            .post('/budgets')
            .send({ categoryId: categoryRes.body.id, month: '2026-09', limitAmount: 5000 })
            .expect(201);

        await request(app.getHttpServer())
            .post('/budgets')
            .send({ categoryId: categoryRes.body.id, month: '2026-09', limitAmount: 3000 })
            .expect(409);
    });

});