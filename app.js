const express = require('exress');

//body-parser is used to parse incoming req bodys
const feedRoutes = require('./routes/feed');


const app = express();
app.use('/feed', feedRoutes);


app.listen(8080);
