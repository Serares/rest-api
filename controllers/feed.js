const { validationResult } = require('express-validator/check');
const Post = require('../models/post');

exports.getPosts = (req, res, next) => {
    //important to send status codes
    //for client to know what to render

    Post.find()
        .then(posts => {
            res.status(200).json({
                message: "Posts found successfully",
                posts: posts
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            // throw will not work in a promise here
            // because it's async
            //throw err
            next(err);
        })

}

exports.createPost = (req, res, next) => {
    const errors = validationResult(req);
    //isEmpty  is a validationResult function
    if (!errors.isEmpty()) {
        const error = new Error('Not valid');
        error.statusCode = 422;
        error.errors = errors.array();
        //this will exit the function and go the the error handling function from express
        // will work here because it's synchronous
        throw error;
        // return res.status(422).json({ message: 'Not valid', errors: errors.array() })
    }
    if (!req.file) {
        const error = new Error('No image provided.');
        error.statuscode = 422;
        throw error;
    }

    const imageUrl = req.file.path.replace('\\', '/');
    //added by bodyParser
    const title = req.body.title;
    const content = req.body.content;
    // no need for createdAt
    // no need for _id ; mongoose will create thoes
    const post = new Post({
        title: title,
        content: content,
        imageUrl: imageUrl,
        creator: { name: "RJ" }
    })

    post.save()
        .then(response => {
            //here we'll get to the db
            //201 success created resource
            res.status(201).json({
                message: "Post created success",
                post: post
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            // throw will not work in a promise here
            // because it's async
            //throw err
            next(err);
        })

}


exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    //if you return from a then
    // the next then will be called with the returned value
    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error("Cant find post");
                error.statusCode = 404;
                // if you throw err in .then
                // it will get to the catch();
                throw error;
            }
            res.status(200).json({ message: "Post found", post: post });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            // throw will not work in a promise here
            // because it's async
            //throw err
            next(err);
        })

}