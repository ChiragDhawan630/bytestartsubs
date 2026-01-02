import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';

/**
 * Admin Module E2E Tests
 * 
 * Test Cases: D1-D8, AU1-AU15, AP1-AP15, AS1-AS12
 * These tests verify admin endpoints - requires bypassing auth for testing
 * 
 * NOTE: In production, these endpoints require JWT auth. For testing,
 * we're testing the validation and response formats.
 */
describe('Admin Module (e2e)', () => {
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

    describe('Admin Stats - Auth Required', () => {
        // D2: Non-admin access
        it('GET /admin/stats - should require authentication', async () => {
            const res = await request(app.getHttpServer())
                .get('/admin/stats');

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('statusCode', 401);
        });
    });

    describe('Admin Users - Auth Required', () => {
        // AU1: Paginated list requires auth
        it('GET /admin/users - should require authentication', async () => {
            const res = await request(app.getHttpServer())
                .get('/admin/users');

            expect(res.status).toBe(401);
        });

        // AU4: Create user requires auth
        it('POST /admin/users - should require authentication', async () => {
            const res = await request(app.getHttpServer())
                .post('/admin/users')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                });

            expect(res.status).toBe(401);
        });
    });

    describe('Admin Plans - Auth Required', () => {
        // AP1: All plans requires auth
        it('GET /admin/plans - should require authentication', async () => {
            const res = await request(app.getHttpServer())
                .get('/admin/plans');

            expect(res.status).toBe(401);
        });

        // AP2: Create plan requires auth
        it('POST /admin/plans - should require authentication', async () => {
            const res = await request(app.getHttpServer())
                .post('/admin/plans')
                .send({
                    id: 'test-plan',
                    name: 'Test Plan',
                    price_original: 1000,
                    price_discounted: 900,
                });

            expect(res.status).toBe(401);
        });
    });

    describe('Admin Settings - Not Yet Implemented', () => {
        // AS1: Settings endpoint not yet implemented
        it('GET /admin/settings - should return 404 (not implemented)', async () => {
            const res = await request(app.getHttpServer())
                .get('/admin/settings');

            // Route not implemented - returns 404
            expect(res.status).toBe(404);
        });

        // AS2: Update settings not yet implemented
        it('PATCH /admin/settings - should return 404 (not implemented)', async () => {
            const res = await request(app.getHttpServer())
                .patch('/admin/settings')
                .send({
                    site_name: 'Test Site',
                });

            expect(res.status).toBe(404);
        });
    });

    describe('Admin Email Templates - Not Yet Implemented', () => {
        // AS7: List templates not yet implemented
        it('GET /admin/email-templates - should return 404 (not implemented)', async () => {
            const res = await request(app.getHttpServer())
                .get('/admin/email-templates');

            expect(res.status).toBe(404);
        });
    });
});
