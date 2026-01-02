
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module'; // Adjust path if needed
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../../../.env');
console.log('Trying to load env from:', envPath);
dotenv.config({ path: envPath });
console.log('Loaded ENV. DATABASE_URL exists?', !!process.env.DATABASE_URL);

async function run() {
    try {
        console.log('Bootstrapping App...');
        const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log', 'debug'] });
        app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
        await app.init();

        console.log('App initialized.');

        console.log('Checking /public/plans...');
        const res = await request(app.getHttpServer()).get('/public/plans');
        console.log('Status:', res.status);
        console.log('Body:', JSON.stringify(res.body, null, 2));

        if (res.status !== 200) {
            throw new Error('Failed to get plans');
        }

        console.log('Checking /public/settings...');
        const res2 = await request(app.getHttpServer()).get('/public/settings');
        console.log('Status:', res2.status);
        console.log('Body:', JSON.stringify(res2.body, null, 2));

        await app.close();
        console.log('Done.');
        process.exit(0);
    } catch (e: any) {
        console.error('FAILED:', e);
        if (e.stack) console.error(e.stack);
        process.exit(1);
    }
}

run();
