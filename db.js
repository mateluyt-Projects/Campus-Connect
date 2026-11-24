require('dotenv').config();
const mysql = require('mysql2');

// Debug: Log what we're reading from environment
console.log('🔍 Database Configuration:');
console.log('  DB_HOST:', process.env.DB_HOST || 'localhost');
console.log('  DB_USER:', process.env.DB_USER || 'root');
console.log('  DB_PASSWORD:', process.env.DB_PASSWORD === undefined ? 'undefined' : 
             process.env.DB_PASSWORD === '' ? '(empty string)' : '(has value)');
console.log('  DB_NAME:', process.env.DB_NAME || 'campus_connect');
console.log('  DB_PORT:', process.env.DB_PORT || 3306);

// Create MySQL connection pool for better performance
// Supports DATABASE_URL for cloud hosting (Railway, Render, etc.) or individual parameters for local XAMPP
let pool;

if (process.env.DATABASE_URL) {
    console.log('  Using DATABASE_URL connection string');
    pool = mysql.createPool(process.env.DATABASE_URL);
} else {
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        database: process.env.DB_NAME || 'campus_connect',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };

    // Only add password if it's explicitly set and not empty
    if (process.env.DB_PASSWORD !== undefined && process.env.DB_PASSWORD !== '') {
        dbConfig.password = process.env.DB_PASSWORD;
    }

    console.log('  Using password field:', dbConfig.password !== undefined);
    pool = mysql.createPool(dbConfig);
}

// Convert pool to use promises for async/await
const promisePool = pool.promise();

// Test the database connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        return;
    }
    console.log('✅ Database connected successfully');
    connection.release();
});

module.exports = promisePool;
