
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/src/app.module');
const { ValidationPipe } = require('@nestjs/common');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

async function run() {
    try {
        const app = await NestFactory.create(AppModule, { logger: false });
        app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
        await app.init();
        await app.close();
        fs.writeFileSync('e2e_result.txt', 'SUCCESS');
        process.exit(0);
    } catch (e) {
        fs.writeFileSync('e2e_result.txt', `FAILED: ${e.message}\nSTACK: ${e.stack}`);
        process.exit(1);
    }
}

run();
