
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../../../.env');
try {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split(/\r?\n/);
    const line37 = lines[36]; // 0-indexed
    fs.writeFileSync('extracted_line.txt', line37 || 'LINE_NOT_FOUND');
} catch (e) {
    fs.writeFileSync('extracted_line.txt', 'ERROR: ' + e.message);
}
