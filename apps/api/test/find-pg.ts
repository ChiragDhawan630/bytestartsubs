
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../../../.env');
try {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split(/\r?\n/);
    const pgLine = lines.find(l => l.includes('postgresql'));
    fs.writeFileSync('pg_line.txt', pgLine || 'POSTGRESQL_NOT_FOUND');
} catch (e) {
    fs.writeFileSync('pg_line.txt', 'ERROR: ' + e.message);
}
