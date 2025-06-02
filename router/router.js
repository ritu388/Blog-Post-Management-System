const express = require('express');
const authController = require('../controller/authController');
const blogController = require('../controller/blogController');
const erorrHandle = require('../middleware/errorHandler');
const app = express();
app.use('/auth', authController);
app.use('/blog', blogController);
app.use(erorrHandle);

module.exports = app;