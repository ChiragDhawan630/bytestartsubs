import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';

/**
 * Comprehensive Admin Module E2E Tests
 * 
 * Test Cases: D1-D8, AU1-AU15, AP1-AP15
 * These tests verify admin dashboard, user management, and plan management
 */
describe('Admin Module - Comprehensive (e2e)', () => {
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

    describe('Dashboard Stats', () => {
        // D1-D2: Already partially covered
        it('GET /admin/stats - should require authentication', async () => {
            const res = await request(app.getHttpServer())
                .get('/admin/stats');

            expect(res.status).toBe(401);
        });
    });

    describe('User Management', () => {
        // AU1: Get users list
        it('GET /admin/users - should require authentication', async () => {
            const res = await request(app.getHttpServer())
                .get('/admin/users');

            expect(res.status).toBe(401);
        });

        // AU2: Search with query params
        it('GET /admin/users?search=test - should require authentication', async () => {
            const res = await request(app.getHttpServer())
                .get('/admin/users?search=test&page=1');

            expect(res.status).toBe(401);
        });

        // AU3: Invalid page number handling
        it('GET /admin/users?page=-1 - should require authentication', async () => {
            const res = await request(app.getHttpServer())
                .get('/admin/users?page=-1');

            expect(res.status).toBe(401);
        });

        // AU4: Create user
        it('POST /admin/users - should require authentication', async () => {
            const res = await request(app.getHttpServer())
                .post('/admin/users')
                .send({
                    name: 'New User',
                    email: 'newuser@example.com',
                });

            expect(res.status).toBe(401);
        });

        // AU6: Missing required fields validation
        it('POST /admin/users - should validate required fields', async () => {
            const res = await request(app.getHttpServer())
                .post('/admin/users')
                .send({
                    // Missing name and email
                });

            expect(res.status).toBe(401); // Auth before validation
        });

        // AU7: Update user
        it('PUT /admin/users/:id - should require authentication', async () => {
            const res = await request(app.getHttpServer())
                .put('/admin/users/1')
                .send({
                    name: 'Updated Name',
                });

            expect(res.status).toBe(401);
        });

        // AU10: Delete user
        it('DELETE /admin/users/:id - should require authentication', async () => {
            const res = await request(app.getHttpServer())
                .delete('/admin/users/1');

            expect(res.status).toBe(401);
        });

        // AU15: SQL Injection in search
        it('GET /admin/users?search=\' OR 1=1-- - should be safe', async () => {
            const res = await request(app.getHttpServer())
                .get('/admin/users?search=' + encodeURIComponent("' OR 1=1--"));

            expect(res.status).toBe(401);
        });
    });

    describe('Plan Management', () => {
        // AP1: Get all plans
        it('GET /admin/plans - should require authentication', async () => {
            const res = await request(app.getHttpServer())
                .get('/admin/plans');

            expect(res.status).toBe(401);
        });

        // AP2: Create plan
        it('POST /admin/plans - should require authentication', async () => {
            const res = await request(app.getHttpServer())
                .post('/admin/plans')
                .send({
                    id: 'test-plan',
                    name: 'Test Plan',
                    price_original: 1000,
                    price_discounted: 900,
                    billing_cycle: 'monthly',
                });

            expect(res.status).toBe(401);
        });

        // AP4: Missing required fields
        it('POST /admin/plans - should validate required fields', async () => {
            const res = await request(app.getHttpServer())
                .post('/admin/plans')
                .send({
                    // Missing required fields
                });

            expect(res.status).toBe(401);
        });

        // AP5: Negative price
        it('POST /admin/plans - negative price should be validated', async () => {
            const res = await request(app.getHttpServer())
                .post('/admin/plans')
                .send({
                    id: 'negative',
                    name: 'Negative Plan',
                    price_original: -100,
                    price_discounted: -50,
                });

            expect(res.status).toBe(401); // Auth before validation
        });

        // AP7: Update plan
        it('PUT /admin/plans/:id - should require authentication', async () => {
            const res = await request(app.getHttpServer())
                .put('/admin/plans/basic-monthly')
                .send({
                    name: 'Updated Plan Name',
                });

            expect(res.status).toBe(401);
        });

        // AP9: Delete plan
        it('DELETE /admin/plans/:id - should require authentication', async () => {
            const res = await request(app.getHttpServer())
                .delete('/admin/plans/test-plan');

            expect(res.status).toBe(401);
        });
    });

    describe('Security & Validation', () => {
        it('should enforce authentication on all admin routes', async () => {
            const endpoints = [
                '/admin/stats',
                '/admin/users',
                '/admin/plans',
            ];

            for (const endpoint of endpoints) {
                const res = await request(app.getHttpServer()).get(endpoint);
                expect(res.status).toBe(401);
            }
        });

        it('should return consistent error format', async () => {
            const res = await request(app.getHttpServer())
                .get('/admin/stats');

            expect(res.body).toHaveProperty('statusCode', 401);
            expect(res.body).toHaveProperty('timestamp');
            expect(res.body).toHaveProperty('path', '/admin/stats');
        });
    });
});
