import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/sequelize';
import { Transaction } from '@transactions/models/transaction.model';
import { Category } from '@categories/models/category.model';
import { Budget } from '@budgets/models/budget.model';
import { Tag } from '@tags/models/tag.model';
import { User } from '@users/models/user.model';

describe('Expense Tracker (e2e)', () => {
    let app: INestApplication;
    let accessToken: string;

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
        await app.get(getModelToken(User)).destroy({ where: {}, truncate: { cascade: true } });

        const registerRes = await request(app.getHttpServer())
            .post('/auth/register')
            .send({ email: `test-${Date.now()}@example.com`, password: 'password123' })
            .expect(201);

        accessToken = registerRes.body.accessToken;
    });

    it('creates a category, a transaction with tags and gets the correct summary', async () => {
        const categoryRes = await request(app.getHttpServer())
            .post('/categories')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: 'Food', color: '#FF0000' })
            .expect(201);

        const tagRes = await request(app.getHttpServer())
            .post('/tags')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: 'lunch' })
            .expect(201);

        const txRes = await request(app.getHttpServer())
            .post('/transactions')
            .set('Authorization', `Bearer ${accessToken}`)
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
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200);

        expect(summaryRes.body.totalExpense ?? summaryRes.body.expense).toBe(1500);
    });

    it('filters transactions by tagIds without duplicates', async () => {
        const categoryRes = await request(app.getHttpServer())
            .post('/categories')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: 'Transport', color: '#00FF00' })
            .expect(201);
        const tag1 = await request(app.getHttpServer())
            .post('/tags')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: 'taxi' })
            .expect(201);
        const tag2 = await request(app.getHttpServer())
            .post('/tags')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: 'urgent' })
            .expect(201);

        await request(app.getHttpServer())
            .post('/transactions')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                categoryId: categoryRes.body.id, amount: 500, type: 'expense', date: '2026-09-01',
                tagIds: [tag1.body.id, tag2.body.id],
            })
            .expect(201);

        const listRes = await request(app.getHttpServer())
            .get(`/transactions?tagIds=${tag1.body.id}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200);

        expect(listRes.body.total).toBe(1);
    });

    it('returns budgetWarning when the budget limit is exceeded', async () => {
        const categoryRes = await request(app.getHttpServer())
            .post('/categories')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: 'Entertainment', color: '#0000FF' })
            .expect(201);
        const categoryId = categoryRes.body.id;

        await request(app.getHttpServer())
            .post('/budgets')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ categoryId, month: '2026-09', limitAmount: 1000 })
            .expect(201);

        const firstRes = await request(app.getHttpServer())
            .post('/transactions')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ categoryId, amount: 600, type: 'expense', date: '2026-09-05' })
            .expect(201);
        expect(firstRes.body.budgetWarning).toBeUndefined();

        const secondRes = await request(app.getHttpServer())
            .post('/transactions')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ categoryId, amount: 500, type: 'expense', date: '2026-09-06' })
            .expect(201);
        expect(secondRes.body.budgetWarning).toBeDefined();
        expect(secondRes.body.budgetWarning.spent).toBe(1100);
    });

    it('does not allow creating a second budget for the same category and month', async () => {
        const categoryRes = await request(app.getHttpServer())
            .post('/categories')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: 'Health', color: '#AA00AA' })
            .expect(201);

        await request(app.getHttpServer())
            .post('/budgets')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ categoryId: categoryRes.body.id, month: '2026-09', limitAmount: 5000 })
            .expect(201);

        await request(app.getHttpServer())
            .post('/budgets')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ categoryId: categoryRes.body.id, month: '2026-09', limitAmount: 3000 })
            .expect(409);
    });

    it('rejects requests without a token', async () => {
        await request(app.getHttpServer())
            .get('/categories')
            .expect(401);
    });

    it('rejects requests with an invalid token', async () => {
        await request(app.getHttpServer())
            .get('/categories')
            .set('Authorization', 'Bearer invalid.token.here')
            .expect(401);
    });

    it('does not allow a second registration with the same email', async () => {
        const email = `duplicate-${Date.now()}@example.com`;

        await request(app.getHttpServer())
            .post('/auth/register')
            .send({ email, password: 'password123' })
            .expect(201);

        await request(app.getHttpServer())
            .post('/auth/register')
            .send({ email, password: 'anotherPassword' })
            .expect(409);
    });

    it('logs in with correct credentials and rejects incorrect ones', async () => {
        const email = `login-${Date.now()}@example.com`;
        const password = 'password123';

        await request(app.getHttpServer())
            .post('/auth/register')
            .send({ email, password })
            .expect(201);

        await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email, password })
            .expect(201);

        await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email, password: 'wrongPassword' })
            .expect(401);
    });

    it('does not allow one user to access another user\'s category', async () => {
        const secondUserRes = await request(app.getHttpServer())
            .post('/auth/register')
            .send({ email: `second-${Date.now()}@example.com`, password: 'password123' })
            .expect(201);
        const secondAccessToken = secondUserRes.body.accessToken;

        const categoryRes = await request(app.getHttpServer())
            .post('/categories')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: 'Private Category', color: '#123456' })
            .expect(201);
        const categoryId = categoryRes.body.id;

        await request(app.getHttpServer())
            .get(`/categories/${categoryId}`)
            .set('Authorization', `Bearer ${secondAccessToken}`)
            .expect(404);

        await request(app.getHttpServer())
            .delete(`/categories/${categoryId}`)
            .set('Authorization', `Bearer ${secondAccessToken}`)
            .expect(404);

        const listRes = await request(app.getHttpServer())
            .get('/categories')
            .set('Authorization', `Bearer ${secondAccessToken}`)
            .expect(200);
        expect(listRes.body.total).toBe(0);
    });
});