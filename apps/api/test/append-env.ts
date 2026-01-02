
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../../../.env');
try {
    const content = fs.readFileSync(envPath, 'utf8');
    // Check if DATABASE_URL is somehow already there to avoid duplicates
    if (!content.includes('DATABASE_URL=')) {
        console.log('Appending DATABASE_URL...');
        // We know the value from pg_line.txt step
        const dbUrl = 'postgresql://postgres:1234@localhost:5432/bytestart_dev';
        fs.appendFileSync(envPath, `\nDATABASE_URL=${dbUrl}\n`);
        console.log('Appended.');
    } else {
        console.log('DATABASE_URL already exists (maybe in the malformed line?). skipping simple append.');
    }
} catch (e) {
    console.error('Error:', e);
}
