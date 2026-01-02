
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
    datasourceUrl: "postgresql://postgres:1234@localhost:5432/bytestart_dev"
});

prisma.$connect()
    .then(() => {
        console.log('Connected!');
        return prisma.$disconnect();
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
