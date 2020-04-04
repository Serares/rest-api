const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const User = require('../models/user');

const authControllers = require('../controllers/auth');

router.put('/signup', [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please enter a valid email.')
        .custom((value, { req }) => {
            return User.findOne({ email: value })
                .then(userDoc => {
                    if (userDoc) {
                        return Promise.reject("Email exists");
                    }
                })
        }),
    body('password')
        .trim()
        .isLength({ min: 5 }),
    body('name')
        .isLength({ min: 5 })
], authControllers.signup);

router.post('/login', authControllers.login);

module.exports = router;