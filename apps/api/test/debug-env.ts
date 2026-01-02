
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../../../.env');
console.log('Resolved Env Path:', envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('Dotenv Error:', result.error);
}

console.log('DATABASE_URL in process.env:', process.env.DATABASE_URL);
