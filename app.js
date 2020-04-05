const express = require('express');
const bodyParser = require('body-parser');
const dbPass = require('./config/db_pass');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const uuid = require('uuid/v4');
const graphQlHttp = require('express-graphql');

const auth = require('./middleware/isAuth');

const graphQlSchema = require("./graphql/schema");
const graphQlResolver = require("./graphql/resolver");
const { clearImage } = require("./util/file");
// const feedRoutes = require('./routes/feed');
// const authRoutes = require('./routes/auth');

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        console.log(file);
        cb(null, uuid() + '' + file.originalname);
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
//body-parser is used to parse incoming req bodys
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
    // this is needed because graphql does not allow OPTIONS method
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
})

app.get('/', (req, res, next) => {
    res.status(200).json({ "message": "Salutare2" })
})

app.use(auth);

app.put('/post-image', (req, res, next) => {
    if (!req.isAuth) {
        throw new Error('Not authenticated!');
    }
    if (!req.file) {
        return res.status(200).json({ message: 'No file provided!' });
    }
    if (req.body.oldPath) {
        clearImage(req.body.oldPath);
    }
    return res
        .status(201)
        .json({ message: 'File stored.', filePath: req.file.path });
});

//make sure to use .use
app.use('/graphql', graphQlHttp({
    schema: graphQlSchema,
    rootValue: graphQlResolver,
    graphiql: true,
    formatError(err) {
        if (!err.originalError) {
            // some technical error
            return err;
        }
        const data = err.originalError.data;
        const message = err.message || 'An error occurred.';
        const code = err.originalError.code || 500;
        return { message: message, status: code, data: data };
    }
}));

app.use((err, req, res, next) => {
    //this is the error handling function
    console.log(err);
    const status = err.statusCode;
    const message = err.message;
    res.status(status).json({ message: message });
})

mongoose.connect(dbPass.mongoPass(), { useNewUrlParser: true, useUnifiedTopology: true })
    .then(result => {
        app.listen(8080);
        // add websockets, they are build on http so we use the server that to establish the connection
        // const io = require('socket.io')(server);
        //first initialized the websocket here before using it in the controllers 
        // const io = require('./socket').init(server);
        // io.on('connection', socket =>{
        //     console.log('client connected');
        // })
    })
    .catch(err => {
        console.log(err)
    });
