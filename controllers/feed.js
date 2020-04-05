const { validationResult } = require('express-validator');
const Post = require('../models/post');


const io = require("../socket");
const fs = require('fs');
const path = require('path');
const User = require('../models/user');

exports.getPosts = async (req, res, next) => {
    //important to send status codes
    //for client to know what to render
    const currentPage = req.query.pageNumber || 1;
    const perPage = 2;
    let totalItems;
    try {

        // async
        totalItems = await Post.find().countDocuments();
        //if you use .populate('creator') it will find the object that has that id and add it to the field
        // it will search for the ref defined in the database
        // if you don't use populate there will be only the ID of the creator
        let posts = await Post.find()
        .populate('creator')
        .sort({createdAt: -1})
        .skip((currentPage - 1) * perPage)
        .limit(perPage);

        res.status(200).json({
            message: "Posts found successfully",
            posts: posts,
            totalItems: totalItems
        });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        // and we use next here because it's an async code
        next(error);
    }

    // no need for catch if we use async await
    //     .catch (err => {
    //     if (!err.statusCode) {
    //         err.statusCode = 500;
    //     }
    //     // throw will not work in a promise here
    //     // because it's async
    //     //throw err
    //     next(err);
    // })
}

exports.createPost = async (req, res, next) => {
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
        creator: req.userId
    })

    try {
        let responseFromPost = await post.save();
        responseFromPost ? console.log("Post saved success", responseFromPost) : null;
        let foundUser = await User.findById(req.userId);
        if (!foundUser) throw new Error("Can't find user to add post");
        foundUser.posts.push(post);
        let resposeUserSaved = await foundUser.save();
        // you can use .emit or .broadcast
        io.getIO().emit('posts', { action: 'create', post: {...post._doc,creator:{_id: req.userId, name: foundUser.name} } })

        res.status(201).json({
            message: "Post created success",
            post: post,
            creator: { _id: foundUser._id, name: foundUser.name },
            response: resposeUserSaved
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        // throw will not work in a promise here
        // because it's async
        //throw err
        next(err);
    }
}


exports.getPost = async (req, res, next) => {
    const postId = req.params.postId;
    //if you return from a then
    // the next then will be called with the returned value
    try {

        let foundPost = await Post.findById(postId);
        if (!foundPost) {
            const error = new Error("Cant find post");
            error.statusCode = 404;
            // if you throw err in .then
            // it will get to the catch();
            throw error;
        }
        res.status(200).json({ message: "Post found", post: foundPost });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        // throw will not work in a promise here
        // because it's async
        //throw err
        next(err);
    }

    // Post.findById(postId)
    //     .then(post => {
    //         if (!post) {
    //             const error = new Error("Cant find post");
    //             error.statusCode = 404;
    //             // if you throw err in .then
    //             // it will get to the catch();
    //             throw error;
    //         }
    //         res.status(200).json({ message: "Post found", post: post });
    //     })
    //     .catch(err => {
    //         if (!err.statusCode) {
    //             err.statusCode = 500;
    //         }
    //         // throw will not work in a promise here
    //         // because it's async
    //         //throw err
    //         next(err);
    //     })

}

exports.changePost = async (req, res, next) => {
    const errors = validationResult(req);
    const postId = req.params.postId;
    try {
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
            imageUrl = req.file.path;
        }

        if (!imageUrl) {
            const error = new Error("No image picked");
            error.statusCode = 422;
            throw error;
        }

        let foundPost = await Post.findById(postId).populate('creator');
        if (!foundPost) {
            const error = new Error("Cant find post");
            error.statusCode = 404;
            // if you throw err in .then
            // it will get to the catch();
            throw error;
        }
        if (foundPost.creator._id.toString() !== req.userId) {
            const error = new Error('Authorization error');
            throw error;
        }
        // meaning that the image was changed
        // and the last image needs to be deleted
        if (imageUrl !== foundPost.imageUrl) {
            clearImage(foundPost.ImageUrl);
        }
        foundPost.title = title;
        foundPost.imageUrl = imageUrl;
        foundPost.content = content;
        let savePostResult = await foundPost.save();
        io.getIO().emit('posts', {action: 'update', post: savePostResult})
        res.status(200).json({ message: "Post updated", post: savePostResult });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        // throw will not work in a promise here
        // because it's async
        //throw err
        next(err);
    }

    // Post.findById(postId)
    //     .then(post => {
    //         if (!post) {
    //             const error = new Error("Cant find post");
    //             error.statusCode = 404;
    //             // if you throw err in .then
    //             // it will get to the catch();
    //             throw error;
    //         }
    //         if (post.creator.toString() !== req.userId) {
    //             const error = new Error('Authorization error');
    //             throw error;
    //         }
    //         // meaning that the image was changed
    //         // and the last image needs to be deleted
    //         if (imageUrl !== post.imageUrl) {
    //             clearImage(post.ImageUrl);
    //         }

    //         post.title = title;
    //         post.imageUrl = imageUrl;
    //         post.content = content;
    //         return post.save();
    //     })
    //     .then(result => {
    //         //we get the result of the .save();
    //         res.status(200).json({ message: "Post updated", post: result });
    //     })
    //     .catch(err => {
    //         if (!err.statusCode) {
    //             err.statusCode = 500;
    //         }
    //         // throw will not work in a promise here
    //         // because it's async
    //         //throw err
    //         next(err);
    //     })

}

exports.deletePost = async (req, res, next) => {
    const postId = req.params.postId;

    try {

        let foundPost = await Post.findById(postId);
        if (!foundPost) {
            const error = new Error("Cant find post");
            error.statusCode = 404;
            // if you throw err in .then
            // it will get to the catch();
            throw error;
        }
        if (foundPost.creator.toString() !== req.userId) {
            const error = new Error('Authorization error');
            error.statusCode = 403;
            throw error;
        }
        // image is safe to delete if above conditions are met
        clearImage(foundPost.imageUrl);
        await Post.findByIdAndRemove(postId);
        //clearing posts from the user object in the db
        let foundUser = await User.findById(req.userId);
        // mongoose provided method
        foundUser.posts.pull();
        let saveUserResult = await foundUser.save();
        console.log("Deleted", saveUserResult);
        io.getIO().emit('posts', {action: 'delete', post: postId})
        res.status(200).json({ message: "Deleted Post" });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        // throw will not work in a promise here
        // because it's async
        //throw err
        next(err);
    }
    // Post.findById(postId)
    //     .then(post => {
    //         //logged user?
    //         if (!post) {
    //             const error = new Error("Cant find post");
    //             error.statusCode = 404;
    //             // if you throw err in .then
    //             // it will get to the catch();
    //             throw error;
    //         }
    //         if (post.creator.toString() !== req.userId) {
    //             const error = new Error('Authorization error');
    //             error.statusCode = 403;
    //             throw error;
    //         }
    //         clearImage(post.imageUrl);
    //         return Post.findByIdAndRemove(postId);
    //     })
    //     .then(result => {
    //         console.log("Post deleted", result);
    //         //clearing posts from user object in the DB
    //         return User.findById(req.userId);
    //     })
    //     .then(user => {
    //         // pull is a mongoose method in this case
    //         // deleting the post from the user object
    //         user.posts.pull(postId);
    //         return user.save();
    //     })
    //     .then(result => {
    //         console.log("Deleted", result);
    //         res.status(200).json({ message: "Deleted Post" });
    //     })
    //     .catch(err => {
    //         if (!err.statusCode) {
    //             err.statusCode = 500;
    //         }
    //         // throw will not work in a promise here
    //         // because it's async
    //         //throw err
    //         next(err);
    //     })
}

exports.getUserStatus = async (req, res, next) => {
    const userId = req.userId;
    try {
        let foundUser = await User.findById(userId);
        if (!foundUser) {
            throw new Error("Can't find user to get it's status")
        }
        res.status(200).json({ message: "Found user status", status: foundUser.status });
    } catch (err) {
        const error = new Error("Network Error");
        error.statusCode = 500;
        error.otherErrors = err;
        next(error);
    }
    // User.findById(userId)
    //     .then(user => {
    //         console.log(user);
    //         if (!user) {
    //             throw new Error("Can't find user with this userId")
    //         }

    //         res.status(200).json({ message: "Found user status", status: user.status })
    //     })
    //     .catch(error => {
    //         const err = new Error('Network error');
    //         err.statusCode = 500;
    //         err.error = error;
    //         next(err);
    //     })
}

exports.updateUserStatus = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error("Invalid status");
        error.statusCode = 422;
        throw error;
    }
    const userId = req.userId;
    const newStatus = req.body.status;

    try {
        //if it returns a promise you can use await on that method
        let foundUser = await User.findById(userId);
        if (!foundUser) {
            throw new Error("Can't find user change status")
        }

        if (!newStatus) {
            throw new Error("New status is empty");
        }
        foundUser.status = newStatus;
        let saveUserResult = await foundUser.save();
        console.log("Status update success");
        res.status(201).json({ message: "User status changed success", result: saveUserResult })
    } catch (error) {
        const err = new Error('Network error');
        err.statusCode = 500;
        err.otherErrors = error;
        next(err);
    }

    // User.findById(userId)
    //     .then(user => {
    //         if (!user) {
    //             throw new Error("Can't find user change status")
    //         }

    //         if (!newStatus) {
    //             throw new Error("New status is empty");
    //         }
    //         user.status = newStatus;
    //         return user.save()
    //     })
    //     .then(result => {
    //         console.log("Status updated success");
    //         res.status(201).json({ message: "User status changed success", result: result });
    //     })
    //     .catch(error => {
    //         const err = new Error('Network error');
    //         err.statusCode = 500;
    //         err.error = error;
    //         next(err);
    //     })
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