const { validationResult } = require('express-validator/check');


exports.getPosts = (req, res, next) => {
    //important to send status codes
    //for client to know what to render
    res.status(200).json({
        posts: [
            {
                _id: 1,
                title: "FirstPost1",
                content: "Salutare",
                imageUrl: './images/imagine1.png',
                creator: {
                    name: "The dude"
                },
                createdAt: new Date()
            }
        ]
    });
}

exports.createPost = (req, res, next) => {
    const errors = validationResult(req);
    //isEmpty  is a validationResult function
    if (!errors.isEmpty()) {
        return res.status(422).json({ message: 'Not valid', errors: errors.array() })
    }
    console.log("Changed 1", req.body);
    //added by bodyParser
    const title = req.body.title;
    const content = req.body.content;
    //here we'll get to the db
    //201 success created resource
    res.status(201).json({
        message: "Post created success",
        post: {
            _id: new Date().getTime(),
            title: title,
            content: content,
            creator: { name: "RJ" },
            createdAt: new Date()
        }
    });
}