
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();
prisma.$connect()
    .then(() => console.log('Success'))
    .catch(err => {
        console.log('Error Message:', err.message);
        process.exit(1);
    });
