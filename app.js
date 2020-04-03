const express = require('express');
const bodyParser = require('body-parser');

//body-parser is used to parse incoming req bodys
const feedRoutes = require('./routes/feed');

const app = express();
//app.use(bodyParser.urlencoded()) -> used for x-www-form-urlencoded <form>
app.use(bodyParser.json()) // good for application/json
app.use((req,res,next)=>{
    //cors res
    //this does not send a response just sets a Header
    // you can lock cors to one domain 'exampledomain.com'
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,PATCH,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
})

app.use('/feed', feedRoutes);
app.get('/', (req,res,next)=>{
    res.status(200).json({"message":"Salutare1"})
})


app.listen(8080);
