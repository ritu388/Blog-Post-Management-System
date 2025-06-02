// const mongoose = require('mongoose');
// require('dotenv').config();
// const mongoURL = process.env.DataBase_Url;

// mongoose.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true })
//     .then(() => console.log('MongoDB connected successfully'))
//     .catch(err => console.error('MongoDB connection error:', err));


// module.exports = mongoose;
require('dotenv').config();
const mysql = require("mysql2");

const connection = mysql.createConnection({
    // host: process.env.DB_HOST,
    // port: process.env.DB_PORT,
    // user: process.env.DB_USER,
    // password: process.env.DB_PASSWORD,
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'BlogPostManagementSystem'
});

connection.connect((err) => {
    if (err) {
        return err;
    } else {
        console.log('database is connected ');
    }
});


module.exports = connection;