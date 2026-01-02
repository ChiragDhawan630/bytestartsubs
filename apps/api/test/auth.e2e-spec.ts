import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';

/**
 * Authentication & JWT E2E Tests
 * 
 * Test Cases: A4-A9, A15
 * These tests verify JWT authentication behavior without requiring Google OAuth
 */
describe('Authentication (e2e)', () => {
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

    describe('JWT Token Validation', () => {
        // A7: Missing Authorization header
        it('should return 401 for protected route without token', async () => {
            const res = await request(app.getHttpServer())
                .get('/subscriptions/my-subscriptions');

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('statusCode', 401);
        });

        // A6: Malformed token
        it('should return 401 for malformed JWT token', async () => {
            const res = await request(app.getHttpServer())
                .get('/subscriptions/my-subscriptions')
                .set('Authorization', 'Bearer invalid.token.here');

            expect(res.status).toBe(401);
        });

        // A8: Invalid signature
        it('should return 401 for JWT with invalid signature', async () => {
            // Valid JWT structure but wrong signature
            const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSJ9.INVALID_SIGNATURE';

            const res = await request(app.getHttpServer())
                .get('/subscriptions/my-subscriptions')
                .set('Authorization', `Bearer ${fakeToken}`);

            expect(res.status).toBe(401);
        });

        // A9: Protected route - No token
        it('should return 401 for admin route without token', async () => {
            const res = await request(app.getHttpServer())
                .get('/admin/stats');

            expect(res.status).toBe(401);
        });
    });

    describe('Public Routes Access', () => {
        it('should allow access to public plans without auth', async () => {
            const res = await request(app.getHttpServer())
                .get('/public/plans');

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        it('should allow access to public settings without auth', async () => {
            const res = await request(app.getHttpServer())
                .get('/public/settings');

            expect(res.status).toBe(200);
            expect(typeof res.body).toBe('object');
        });
    });

    describe('Error Response Format', () => {
        // V6-V11: HttpExceptionFilter formats
        it('should return consistent error format with timestamp and path', async () => {
            const res = await request(app.getHttpServer())
                .get('/subscriptions/my-subscriptions');

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('statusCode');
            expect(res.body).toHaveProperty('timestamp');
            expect(res.body).toHaveProperty('path');
            expect(res.body).toHaveProperty('message');

            // Validate timestamp is ISO format
            expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
        });
    });
});
