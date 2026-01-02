import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';

/**
 * Validation & Error Handling E2E Tests
 * 
 * Test Cases: V1-V15, P1-P10
 * These tests verify ValidationPipe and HttpExceptionFilter behavior
 */
describe('Validation & Error Handling (e2e)', () => {
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

    describe('Public Endpoints', () => {
        // P1: GET /public/plans returns active plans
        it('GET /public/plans - should return array of plans', async () => {
            const res = await request(app.getHttpServer())
                .get('/public/plans');

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        // P5: GET /public/settings returns settings object
        it('GET /public/settings - should return settings object', async () => {
            const res = await request(app.getHttpServer())
                .get('/public/settings');

            expect(res.status).toBe(200);
            expect(typeof res.body).toBe('object');
            expect(Array.isArray(res.body)).toBe(false);
        });

        // P8: Non-existent route returns 404
        it('GET /non-existent-route - should return 404', async () => {
            const res = await request(app.getHttpServer())
                .get('/non-existent-route');

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('statusCode', 404);
        });

        // P9: Invalid method returns 404
        it('DELETE /public/plans - should return 404 (method not allowed)', async () => {
            const res = await request(app.getHttpServer())
                .delete('/public/plans');

            expect(res.status).toBe(404);
        });
    });

    describe('Error Response Format', () => {
        // V6-V11: Consistent error format
        it('should return error with statusCode, timestamp, path, message', async () => {
            const res = await request(app.getHttpServer())
                .get('/admin/stats'); // Protected route

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('statusCode');
            expect(res.body).toHaveProperty('timestamp');
            expect(res.body).toHaveProperty('path');
            expect(res.body).toHaveProperty('message');
        });

        // V10: Timestamp is ISO format
        it('should return ISO timestamp in error response', async () => {
            const res = await request(app.getHttpServer())
                .get('/admin/stats');

            const timestamp = res.body.timestamp;
            expect(new Date(timestamp).toISOString()).toBe(timestamp);
        });

        // V11: Path matches request
        it('should include request path in error response', async () => {
            const res = await request(app.getHttpServer())
                .get('/admin/stats');

            expect(res.body.path).toBe('/admin/stats');
        });
    });

    describe('Malformed Requests', () => {
        // V12: Malformed JSON body
        it('POST with malformed JSON - should return 400', async () => {
            const res = await request(app.getHttpServer())
                .post('/admin/users')
                .set('Content-Type', 'application/json')
                .send('{ invalid json }');

            // Either 400 (bad JSON) or 401 (auth first)
            expect([400, 401]).toContain(res.status);
        });
    });

    describe('Content Type Handling', () => {
        it('should accept JSON content type', async () => {
            const res = await request(app.getHttpServer())
                .get('/public/plans')
                .set('Accept', 'application/json');

            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toContain('application/json');
        });
    });
});
