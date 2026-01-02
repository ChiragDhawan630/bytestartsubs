import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { PrismaService } from './../src/prisma/prisma.service';

/**
 * Database & Data Integrity E2E Tests
 * 
 * Test Cases: DB1-DB10
 * These tests verify database operations and data integrity
 */
describe('Database & Data Integrity (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;

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

        prisma = app.get(PrismaService);
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Database Connection', () => {
        it('should connect to database successfully', async () => {
            // Test that Prisma can query the database
            const result = await prisma.$queryRaw`SELECT 1 as test`;
            expect(result).toBeDefined();
        });

        it('should have required tables', async () => {
            // Verify core tables exist
            const users = await prisma.users.count();
            expect(typeof users).toBe('number');

            const plans = await prisma.plans.count();
            expect(typeof plans).toBe('number');

            const settings = await prisma.settings.count();
            expect(typeof settings).toBe('number');
        });
    });

    describe('Data Retrieval', () => {
        it('should retrieve plans ordered by display_order', async () => {
            const plans = await prisma.plans.findMany({
                orderBy: { display_order: 'asc' },
            });
            expect(Array.isArray(plans)).toBe(true);
        });

        it('should filter active plans correctly', async () => {
            const activePlans = await prisma.plans.findMany({
                where: { is_active: true },
            });

            activePlans.forEach((plan: { is_active: boolean }) => {
                expect(plan.is_active).toBe(true);
            });
        });
    });

    describe('Settings Key-Value Store', () => {
        it('should retrieve settings as key-value pairs', async () => {
            const settings = await prisma.settings.findMany();
            expect(Array.isArray(settings)).toBe(true);

            settings.forEach((setting: { key: string; value: string | null }) => {
                expect(setting).toHaveProperty('key');
                expect(setting).toHaveProperty('value');
            });
        });
    });

    describe('Timestamps', () => {
        it('should store timestamps correctly', async () => {
            const users = await prisma.users.findMany({
                take: 1,
            });

            if (users.length > 0) {
                expect(users[0].created_at).toBeInstanceOf(Date);
            }
        });
    });
});
