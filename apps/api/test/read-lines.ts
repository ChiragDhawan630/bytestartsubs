
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../../../.env');
try {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split(/\r?\n/);
    for (let i = 28; i < 40; i++) {
        if (lines[i] !== undefined) {
            console.log(`[${i + 1}] ${lines[i]}`);
        }
    }
} catch (e) {
    console.error('Error:', e);
}
