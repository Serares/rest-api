const { validationResult } = require('express-validator');
const Post = require('../models/post');
//florinSalam
const fs = require('fs');
const path = require('path');
const User = require('../models/user');

exports.getPosts = (req, res, next) => {
    //important to send status codes
    //for client to know what to render
    const currentPage = req.query.pageNumber || 1;
    const perPage = 2;
    let totalItems;

    Post.find()
        .countDocuments()
        .then(count => {
            totalItems = count;
            return Post.find()
                .skip((currentPage - 1) * perPage)
                .limit(perPage);
        })
        .then(posts => {
            res.status(200).json({
                message: "Posts found successfully",
                posts: posts,
                totalItems: totalItems
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
    let creator;
    // no need for createdAt
    // no need for _id ; mongoose will create thoes
    const post = new Post({
        title: title,
        content: content,
        imageUrl: imageUrl,
        creator: req.userId
    })

    post.save()
        .then(response => {
            return User.findById(req.userId);
        })
        .then(user => {
            //adding the post to the user obj in db
            user.posts.push(post);
            creator = user;
            // saving the use again with the new data
            return user.save()
        })
        .then(response => {
            //here we'll get to the db
            //201 success created resource
            res.status(201).json({
                message: "Post created success",
                post: post,
                creator: { _id: creator._id, name: creator.name }
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

exports.changePost = (req, res, next) => {
    const errors = validationResult(req);
    const postId = req.params.postId;
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

    //TODO fix the bug when changing the image
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;

    console.log("req body", req.body);
    if (req.file) {
        console.log(req.file);
        imageUrl = req.file.path.replace('\\', '/');
    }

    if (!imageUrl) {
        const error = new Error("No image picked");
        error.statusCode = 422;
        throw error;
    }

    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error("Cant find post");
                error.statusCode = 404;
                // if you throw err in .then
                // it will get to the catch();
                throw error;
            }
            if (post.creator.toString() !== req.userId) {
                const error = new Error('Authorization error');
                throw error;
            }
            // meaning that the image was changed
            // and the last image needs to be deleted
            if (imageUrl !== post.imageUrl) {
                clearImage(post.ImageUrl);
            }

            post.title = title;
            post.imageUrl = imageUrl;
            post.content = content;
            return post.save();
        })
        .then(result => {
            //we get the result of the .save();
            res.status(200).json({ message: "Post updated", post: result });
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

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .then(post => {
            //logged user?
            if (!post) {
                const error = new Error("Cant find post");
                error.statusCode = 404;
                // if you throw err in .then
                // it will get to the catch();
                throw error;
            }
            if (post.creator.toString() !== req.userId) {
                const error = new Error('Authorization error');
                error.statusCode = 403;
                throw error;
            }
            clearImage(post.imageUrl);
            return Post.findByIdAndRemove(postId);
        })
        .then(result => {
            console.log("Post deleted", result);
            //clearing posts from user object in the DB
            return User.findById(req.userId);
        })
        .then(user => {
            // pull is a mongoose method in this case
            // deleting the post from the user object
            user.posts.pull(postId);
            return user.save();
        })
        .then(result => {
            console.log("Deleted", result);
            res.status(200).json({ message: "Deleted Post" });
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

// deleting the image helper function
const clearImage = filePath => {
    //__dirname is the current folder
    // .. going up to the root folder
    // and looking for filePath
    filePath = path.join(__dirname, '..', filePath);
    //deleting the image
    fs.unlink(filePath, error => {
        console.log(error);
    })
}