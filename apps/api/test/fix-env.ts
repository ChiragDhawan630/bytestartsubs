
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../../../.env');
try {
    let content = fs.readFileSync(envPath, 'utf8');
    // Regex to find the merged line
    // Looks for DATABASE_SSL=false immediately followed by postgresql://
    const regex = /(DATABASE_SSL=false)(postgresql:\/\/.*)/;

    if (regex.test(content)) {
        console.log('Found malformed line. Fixing...');
        const newContent = content.replace(regex, '$1\nDATABASE_URL=$2');
        fs.writeFileSync(envPath, newContent, 'utf8');
        console.log('Fixed .env file.');
    } else {
        console.log('No malformed line found matching regex.');
        // Debug: print line that looks like it
        const lines = content.split(/\r?\n/);
        const badLine = lines.find(l => l.includes('DATABASE_SSL=false') && l.includes('postgresql://'));
        if (badLine) {
            console.log('Found similar line but regex failed:', badLine);
            // Fallback fix for simple string split
            const fixedLine = badLine.replace('DATABASE_SSL=false', 'DATABASE_SSL=false\nDATABASE_URL=');
            content = content.replace(badLine, fixedLine);
            fs.writeFileSync(envPath, content, 'utf8');
            console.log('Fixed .env file via fallback.');
        }
    }
} catch (e) {
    console.error('Error:', e);
}
