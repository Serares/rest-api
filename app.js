const express = require('express');
const bodyParser = require('body-parser');
const dbPass = require('./config/db_pass');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const uuid = require('uuid/v4');

//body-parser is used to parse incoming req bodys
const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        console.log(file);
        cb(null, uuid() +''+ file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        // meaning the file can pass;
        cb(null, true);
    } else {
        cb(null, false);
    }
}

const app = express();
//app.use(bodyParser.urlencoded()) -> used for x-www-form-urlencoded <form>
app.use(bodyParser.json()) // good for application/json
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'))
app.use('/images', express.static(path.join(__dirname, 'images')))
app.use((req, res, next) => {
    //cors res
    //this does not send a response just sets a Header
    // you can lock cors to one domain 'exampledomain.com'
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
})

app.use('/feed', feedRoutes);
app.use(authRoutes);

app.get('/', (req, res, next) => {
    res.status(200).json({ "message": "Salutare1" })
})

app.use((err, req, res, next) => {
    //this is the error handling function
    console.log(err);
    const status = err.statusCode;
    const message = err.message;
    res.status(status).json({ message: message });
})

mongoose.connect(dbPass.mongoPass(), {useNewUrlParser: true, useUnifiedTopology: true})
    .then(result => {
        app.listen(8080);
    })
    .catch(err => {
        console.log(err)
    });
