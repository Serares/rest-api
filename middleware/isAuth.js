const jwt = require('jsonwebtoken');


module.exports = (req, res, next) => {
    //those headers are comming from client
    // first the token is stored in the localStorage when logging in
    // then the token will be on every request
    const authHeader = req.get("Authorization");
    if(!authHeader){
        const error = new Error('Not Authenticated');
        error.statusCode = 401;
        throw error;
    }
    const token = req.get('Authorization').split(' ')[1];
    let decodedToken;

    try {
        decodedToken = jwt.verify(token, 'supersecret');
    } catch (err) {
        err.statusCode = 500;
        console.log(err);
        throw err;
    }

    if(!decodedToken){
        const error = new Error('Not Authenticated');
        error.statusCode = 401;
        throw error;
    }

    //we have a valid token here
    req.userId = decodedToken.userId;
    next();
}
