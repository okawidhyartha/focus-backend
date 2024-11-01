const { Client } = require('pg');

const client = new Client({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PSDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
});

const connectDB = async () => {
    try {
        await client.connect();
        console.log('Connected to PostgreSQL');
    } catch (error) {
        console.error('Connection error', error.stack);
    }
};

const disconnectDB = async () => {
    await client.end();
    console.log('Disconnected from PostgreSQL');
};

module.exports = { client, connectDB, disconnectDB };