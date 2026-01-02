
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../../../.env');
try {
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('--- ENV START ---');
    content.split('\n').forEach((line, i) => {
        console.log(`${i + 1}: ${line.trim()}`);
    });
    console.log('--- ENV END ---');
} catch (e) {
    console.error('Error reading env:', e);
}
