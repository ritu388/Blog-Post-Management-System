const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const routing = require('./router/router');
// import db file
const db = require('./DBConfig/db.config');
const port = 3200;

app.use(bodyParser.json());
app.use('/api', routing);
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});