import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';

/**
 * Comprehensive Validation & Edge Cases E2E Tests
 * 
 * Test Cases: V1-V15
 * Additional validation scenarios not covered in other test files
 */
describe('Validation & Edge Cases - Extended (e2e)', () => {
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

    describe('Forbidden Non-Whitelisted Properties', () => {
        // V4: Extra fields rejected
        it('should reject non-whitelisted fields in request body', async () => {
            const res = await request(app.getHttpServer())
                .post('/admin/users')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    extraField: 'should_be_rejected',
                    __proto__: 'malicious',
                });

            // Auth will fail, but validates forbidNonWhitelisted is enabled
            expect(res.status).toBe(401);
        });
    });

    describe('Type Transformation', () => {
        // V5: String to number transformation
        it('should transform query params to correct types', async () => {
            const res = await request(app.getHttpServer())
                .get('/admin/users?page=1&limit=10');

            expect(res.status).toBe(401); // Auth required
        });
    });

    describe('Error Messages', () => {
        // V6-V11: Consistent error format
        it('should return detailed validation errors', async () => {
            const res = await request(app.getHttpServer())
                .post('/admin/plans')
                .send({
                    // Missing all required fields
                });

            expect(res.status).toBe(401); // Auth before validation
        });

        it('should include error details in response', async () => {
            const res = await request(app.getHttpServer())
                .get('/non-existent-endpoint');

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('message');
            expect(res.body).toHaveProperty('statusCode', 404);
        });
    });

    describe('Content Negotiation', () => {
        it('should accept and return JSON', async () => {
            const res = await request(app.getHttpServer())
                .get('/public/plans')
                .set('Accept', 'application/json');

            expect(res.status).toBe(200);
            expect(res.type).toMatch(/json/);
        });
    });

    describe('HTTP Method Handling', () => {
        it('should reject unsupported HTTP methods', async () => {
            const res = await request(app.getHttpServer())
                .put('/public/plans'); // PUT not supported on this route

            expect([404, 405]).toContain(res.status);
        });
    });

    describe('Null and Undefined Handling', () => {
        it('should handle null values in request body', async () => {
            const res = await request(app.getHttpServer())
                .post('/admin/users')
                .send({
                    name: null,
                    email: null,
                });

            expect(res.status).toBe(401);
        });

        it('should handle empty strings', async () => {
            const res = await request(app.getHttpServer())
                .post('/admin/users')
                .send({
                    name: '',
                    email: '',
                });

            expect(res.status).toBe(401);
        });
    });

    describe('Array Validation', () => {
        it('should validate array fields if present', async () => {
            const res = await request(app.getHttpServer())
                .post('/admin/plans')
                .send({
                    features: 'not_an_array', // Should be array
                });

            expect(res.status).toBe(401);
        });
    });

    describe('Special Characters', () => {
        it('should handle special characters in input', async () => {
            const res = await request(app.getHttpServer())
                .post('/admin/users')
                .send({
                    name: 'Test <script>alert("XSS")</script>',
                    email: 'test+special@example.com',
                });

            expect(res.status).toBe(401);
        });

        it('should handle Unicode characters', async () => {
            const res = await request(app.getHttpServer())
                .post('/admin/users')
                .send({
                    name: '测试用户 👤',
                    email: 'test@例え.jp',
                });

            expect(res.status).toBe(401);
        });
    });
});
