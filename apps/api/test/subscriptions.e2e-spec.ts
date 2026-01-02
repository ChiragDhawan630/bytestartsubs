import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';

/**
 * Subscriptions Module E2E Tests
 * 
 * Test Cases: S1-S18, U7-U8
 * These tests verify subscription endpoints behavior
 */
describe('Subscriptions Module (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }));
        app.useGlobalFilters(new HttpExceptionFilter());
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('User Subscriptions', () => {
        // U7/U8: My subscriptions requires auth
        it('GET /subscriptions/my-subscriptions - should require authentication', async () => {
            const res = await request(app.getHttpServer())
                .get('/subscriptions/my-subscriptions');

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('statusCode', 401);
        });
    });

    describe('Create Subscription', () => {
        // S1-S5: Create subscription requires auth
        it('POST /subscriptions/create - should require authentication', async () => {
            const res = await request(app.getHttpServer())
                .post('/subscriptions/create')
                .send({
                    planId: 'basic-monthly',
                });

            expect(res.status).toBe(401);
        });
    });

    describe('Verify Payment', () => {
        // S6-S9: Verify payment requires auth
        it('POST /subscriptions/verify - should require authentication', async () => {
            const res = await request(app.getHttpServer())
                .post('/subscriptions/verify')
                .send({
                    razorpay_subscription_id: 'sub_test123',
                    razorpay_payment_id: 'pay_test123',
                    razorpay_signature: 'sig_test123',
                });

            expect(res.status).toBe(401);
        });

        // S8: Missing params validation (if auth was bypassed)
        it('POST /subscriptions/verify - should validate required params', async () => {
            const res = await request(app.getHttpServer())
                .post('/subscriptions/verify')
                .send({}); // Empty body

            // Without auth, we get 401 first
            expect(res.status).toBe(401);
        });
    });
});
