const connection = require('../DBConfig/db.config');

const createUserTable = `CREATE TABLE IF NOT EXISTS userDetail (
   id INT AUTO_INCREMENT PRIMARY KEY, 
   full_name varchar(255),
   email varchar(255) UNIQUE,
   password varchar(255),
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

connection.query(createUserTable, (err, results) => {
    if (err) {
        console.error('Error creating table:', err.message);
    } else {
        console.log('Table created successfully');
    }
    // connection.end(); // Close connection
});

module.exports = connection;