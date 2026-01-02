
const { Client } = require('pg');
const client = new Client({
    connectionString: "postgresql://postgres:1234@localhost:5432/bytestart_dev"
});

client.connect()
    .then(() => {
        console.log('Connected to PG!');
        return client.query('SELECT current_database(), current_user');
    })
    .then(res => {
        console.log('QueryResult:', res.rows[0]);
        return client.end();
    })
    .catch(err => {
        console.error('PG Connection Error:', err.message);
        process.exit(1);
    });
