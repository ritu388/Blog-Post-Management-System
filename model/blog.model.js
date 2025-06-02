const connection = require('../DBConfig/db.config');

const createBlogTable = `CREATE TABLE IF NOT EXISTS blogPostTable (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

connection.query(createBlogTable, (er, result) => {
    if (er) {
        return er;
    } else {
        console.log('Table created successfully');
    }
});

module.exports = connection;