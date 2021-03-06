const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const feedController = require('../controllers/feed');
const isAuth = require('../middleware/isAuth');

//GET feed/posts
router.get('/posts', isAuth, feedController.getPosts);

router.post('/post', isAuth, [
    body('title')
        .trim()
        .isLength({ min: 5 }),
    body('content')
        .trim()
        .isLength({ min: 5 })
], feedController.createPost);

router.get('/post/:postId', isAuth, feedController.getPost);

router.put('/post/:postId', isAuth, [
    body('title')
        .trim()
        .isLength({ min: 5 }),
    body('content')
        .trim()
        .isLength({ min: 5 })
], feedController.changePost);

router.delete('/post/:postId', isAuth, feedController.deletePost);

router.get('/userStatus', isAuth, feedController.getUserStatus);

router.put('/updateUserStatus', isAuth, [
    body('status')
        .trim()
        .isLength({ min: 5 })
], feedController.updateUserStatus);

module.exports = router;
