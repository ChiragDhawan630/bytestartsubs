import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';

/**
 * Invoices Module E2E Tests
 * 
 * Test Cases: AI1-AI15
 * These tests verify invoice endpoints behavior
 */
describe('Invoices Module (e2e)', () => {
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

    describe('Invoice List', () => {
        // AI1: List invoices requires auth
        it('GET /invoices - should require authentication', async () => {
            const res = await request(app.getHttpServer())
                .get('/invoices');

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('statusCode', 401);
        });
    });

    describe('Invoice Download', () => {
        // AI5: Download PDF requires auth
        it('GET /invoices/:id/download - should require authentication', async () => {
            const res = await request(app.getHttpServer())
                .get('/invoices/1/download');

            expect(res.status).toBe(401);
        });
    });

    describe('Invoice Send', () => {
        // AI7: Send invoice requires auth
        it('POST /invoices/:id/send - should require authentication', async () => {
            const res = await request(app.getHttpServer())
                .post('/invoices/1/send')
                .send({
                    email: 'customer@example.com',
                });

            expect(res.status).toBe(401);
        });
    });
});
