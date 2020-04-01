


exports.getPosts = (req, res, next) => {
    //important to send status codes
    //for client to know what to render
    res.status(200).json({
        posts: [{ title: "FirstPost" }]
    });
}

exports.createPost = (req, res, next) => {
    //added by bodyParser
    const title = req.body.title;
    const content = req.body.content;
    //here we'll get to the db
    //201 success created resource
    res.status(201).json({
        message: "Post created success",
        post: [{ id: new Date().getTime() ,title: title }]
    });
}