
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../../../.env');
try {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split(/\r?\n/);
    const chunk = lines.slice(34, 40).join('\n');
    fs.writeFileSync('extracted_lines.txt', chunk);
} catch (e) {
    fs.writeFileSync('extracted_lines.txt', 'ERROR: ' + e.message);
}
