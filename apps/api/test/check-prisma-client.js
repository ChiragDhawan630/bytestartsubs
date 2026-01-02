
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

console.log('DATABASE_URL:', process.env.DATABASE_URL);

async function main() {
    const prisma = new PrismaClient();
    try {
        await prisma.$connect();
        console.log('Connected successfully!');
        const users = await prisma.users.findMany({ take: 1 });
        console.log('Users found:', users.length);
    } catch (e) {
        console.error('Connection failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
