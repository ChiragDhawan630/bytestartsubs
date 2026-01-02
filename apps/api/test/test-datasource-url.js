
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

async function main() {
    const prisma = new PrismaClient({
        datasourceUrl: process.env.DATABASE_URL
    });
    try {
        await prisma.$connect();
        console.log('Connected with datasourceUrl!');
    } catch (e) {
        console.log('Failed even with datasourceUrl:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
