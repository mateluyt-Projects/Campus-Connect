// Test database connection with different configurations
const mysql = require('mysql2');

console.log('Testing MySQL connections...\n');

// Test 1: No password
console.log('Test 1: Connecting with NO password...');
const conn1 = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: undefined,
    database: 'campus_connect'
});

conn1.connect((err) => {
    if (err) {
        console.log('❌ Failed with undefined password:', err.message);
    } else {
        console.log('✅ Success with undefined password!');
        conn1.end();
    }
    
    // Test 2: Empty string password
    console.log('\nTest 2: Connecting with EMPTY STRING password...');
    const conn2 = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'campus_connect'
    });
    
    conn2.connect((err) => {
        if (err) {
            console.log('❌ Failed with empty string:', err.message);
        } else {
            console.log('✅ Success with empty string!');
            conn2.end();
        }
        
        // Test 3: No password field at all
        console.log('\nTest 3: Connecting WITHOUT password field...');
        const conn3 = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            database: 'campus_connect'
        });
        
        conn3.connect((err) => {
            if (err) {
                console.log('❌ Failed without password field:', err.message);
                console.log('\n⚠️  Your XAMPP MySQL might have a password set!');
                console.log('💡 Try setting DB_PASSWORD=your_xampp_password in .env file');
            } else {
                console.log('✅ Success without password field!');
                conn3.end();
            }
        });
    });
});
