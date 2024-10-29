const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: '172.31.19.195',
    database: 'postgres',
    password: '123',
    port: 5432,
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