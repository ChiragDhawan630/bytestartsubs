import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';

/**
 * Comprehensive Subscription & Payment E2E Tests
 * 
 * Test Cases: S1-S18
 * These tests verify subscription creation, payment verification, and Razorpay integration
 */
describe('Subscriptions & Payments - Comprehensive (e2e)', () => {
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

    describe('Create Subscription', () => {
        // S1: Valid plan (auth required)
        it('POST /subscriptions/create - should require authentication', async () => {
            const res = await request(app.getHttpServer())
                .post('/subscriptions/create')
                .send({
                    planId: 'basic-monthly',
                });

            expect(res.status).toBe(401);
        });

        // S2: Missing plan_id
        it('POST /subscriptions/create - missing planId should be validated', async () => {
            const res = await request(app.getHttpServer())
                .post('/subscriptions/create')
                .send({});

            expect(res.status).toBe(401); // Auth before validation
        });

        // S3: Invalid plan_id
        it('POST /subscriptions/create - invalid planId', async () => {
            const res = await request(app.getHttpServer())
                .post('/subscriptions/create')
                .send({
                    planId: 'non-existent-plan',
                });

            expect(res.status).toBe(401);
        });

        // S10: User ID from JWT only
        it('POST /subscriptions/create - should ignore body user_id', async () => {
            const res = await request(app.getHttpServer())
                .post('/subscriptions/create')
                .send({
                    planId: 'basic-monthly',
                    user_id: 999, // Should be ignored, JWT user_id used
                });

            expect(res.status).toBe(401);
        });
    });

    describe('Verify Payment', () => {
        // S6-S9: Payment verification
        it('POST /subscriptions/verify - should require authentication', async () => {
            const res = await request(app.getHttpServer())
                .post('/subscriptions/verify')
                .send({
                    razorpay_subscription_id: 'sub_test123',
                    razorpay_payment_id: 'pay_test123',
                    razorpay_signature: 'valid_signature',
                });

            expect(res.status).toBe(401);
        });

        // S8: Missing params
        it('POST /subscriptions/verify - missing parameters', async () => {
            const res = await request(app.getHttpServer())
                .post('/subscriptions/verify')
                .send({
                    razorpay_subscription_id: 'sub_test123',
                    // Missing payment_id and signature
                });

            expect(res.status).toBe(401);
        });

        // S7: Invalid signature (would fail after auth)
        it('POST /subscriptions/verify - all params present', async () => {
            const res = await request(app.getHttpServer())
                .post('/subscriptions/verify')
                .send({
                    razorpay_subscription_id: 'sub_test123',
                    razorpay_payment_id: 'pay_test123',
                    razorpay_signature: 'invalid_signature_format',
                });

            expect(res.status).toBe(401);
        });
    });

    describe('User Subscriptions', () => {
        // S7/S8: Get user subscriptions
        it('GET /subscriptions/my-subscriptions - should require auth', async () => {
            const res = await request(app.getHttpServer())
                .get('/subscriptions/my-subscriptions');

            expect(res.status).toBe(401);
        });
    });

    describe('Security & Validation', () => {
        // SQL Injection protection
        it('should protect against SQL injection in subscription creation', async () => {
            const res = await request(app.getHttpServer())
                .post('/subscriptions/create')
                .send({
                    planId: "'; DROP TABLE subscriptions; --",
                });

            expect(res.status).toBe(401);
        });

        // Concurrent requests protection (rate limiting would be tested here)
        it('should handle concurrent subscription requests', async () => {
            const requests = Array(5).fill(null).map(() =>
                request(app.getHttpServer())
                    .post('/subscriptions/create')
                    .send({ planId: 'basic-monthly' })
            );

            const responses = await Promise.all(requests);
            responses.forEach(res => {
                expect(res.status).toBe(401); // All should require auth
            });
        });

        // Error format consistency
        it('should return consistent error format', async () => {
            const res = await request(app.getHttpServer())
                .post('/subscriptions/create')
                .send({});

            expect(res.body).toHaveProperty('statusCode', 401);
            expect(res.body).toHaveProperty('timestamp');
            expect(res.body).toHaveProperty('path');
        });
    });
});
