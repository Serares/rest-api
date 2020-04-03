const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const postSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    creator:{
        type: Object,
        required: true
    }
    //passing an object here as a second parameter 
    // it will create a timestamp when the object is creted
    //see mongoose docs
}, {timestamps: true})


module.exports = mongoose.model('Post', postSchema);