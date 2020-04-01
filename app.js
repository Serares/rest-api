const express = require('express');
const bodyParser = require('body-parser');

//body-parser is used to parse incoming req bodys
const feedRoutes = require('./routes/feed');

const app = express();
//app.use(bodyParser.urlencoded()) -> used for x-www-form-urlencoded <form>
app.use(bodyParser.json()) // good for application/json

app.use('/feed', feedRoutes);


app.listen(8080);
