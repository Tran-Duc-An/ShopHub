const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Point to the database file we created earlier
const dbPath = path.resolve(__dirname, 'E:\\E-Commerce\\DATA\\ecommerce_advanced.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // Strictly enforce foreign key constraints in SQLite
        db.run('PRAGMA foreign_keys = ON;');
    }
});

module.exports = db;