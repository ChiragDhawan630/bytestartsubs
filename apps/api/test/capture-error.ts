
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: envPath });

async function run() {
    try {
        const app = await NestFactory.create(AppModule, { logger: false });
        app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
        await app.init();
        await app.close();
        fs.writeFileSync('e2e_result.txt', 'SUCCESS');
        process.exit(0);
    } catch (e: any) {
        fs.writeFileSync('e2e_result.txt', `FAILED: ${e.message}\nSTACK: ${e.stack}`);
        process.exit(1);
    }
}

run();
