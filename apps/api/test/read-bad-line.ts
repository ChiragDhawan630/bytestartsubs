
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../../../.env');
try {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split(/\r?\n/);
    lines.forEach((line, i) => {
        if (line.includes('DATABASE_SSL=falsepostgresql')) {
            console.log(`MATCH LINE ${i + 1}: ${line}`);
        }
    });
} catch (e) {
    console.error('Error:', e);
}
