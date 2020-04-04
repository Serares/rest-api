const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

exports.signup = (req, res, next) => {
    const errors = validationResult(req);
    //isEmpty  is a validationResult function
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed');
        error.statusCode = 422;
        error.errors = errors.array();
        //this will exit the function and go the the error handling function from express
        // will work here because it's synchronous
        throw error;
        // return res.status(422).json({ message: 'Not valid', errors: errors.array() })
    }

    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    bcrypt.hash(password, 12)
        .then(hashedPassword => {
            const user = new User({
                email: email,
                name: name,
                password: hashedPassword
            })
            return user.save();
        })
        .then(response => {
            res.status(201).json({
                message: "User creted succesfully",
                response: response
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

exports.login = (req, res, next) => {

    const email = req.body.email;
    const password = req.body.password;
    User.findOne({ email: email })
        .then(user => {
            //user can be undefined
            if (!user) {
                if (!errors.isEmpty()) {
                    const error = new Error('User is not in the data base');
                    error.statusCode = 401;
                    throw error;
                }
            }
            return bcrypt.compare(password, user.password);
        })
        .then(isEqual => {
            if (!isEqual) {
                if (!errors.isEmpty()) {
                    // for test purpose 
                    // but on login validation is better to not tell which one is not correct
                    const error = new Error('Password is not good');
                    error.statusCode = 401;
                    throw error;
                }
            }
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