
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/src/app.module');
const { ValidationPipe } = require('@nestjs/common');
const request = require('supertest');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

async function run() {
    try {
        console.log('Bootstrapping built app...');
        const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
        app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
        await app.init();

        console.log('App initialized.');

        console.log('Checking /public/plans...');
        const res = await request(app.getHttpServer()).get('/public/plans');
        console.log('Status:', res.status);
        console.log('Body Count:', res.body ? res.body.length : 'NULL');

        await app.close();
        console.log('Done.');
        process.exit(0);
    } catch (e) {
        console.error('FAILED:', e);
        if (e.stack) console.error(e.stack);
        process.exit(1);
    }
}

run();
