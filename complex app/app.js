const express = require('express')
const session = require('express-session')
const{ MongoStore}=require('connect-mongo')
const flash = require('connect-flash')
const markdown =require('marked')
const app = express()
const sanitizeHTML = require('sanitize-html')

app.use(express.urlencoded({extended:false}))
app.use(express.json())

app.use('/api',require('./router-api'))

let sessionOptions=session({
    secret:"javascript is soo damn cool",
    store: MongoStore.create({client:require('./db')}),
    saveUninitialized:false,
    resave: false,
    cookie:{maxAge:1000*60*60*24,httpOnly : true,sameSite:"strict"}
})

app.use(sessionOptions)
app.use(flash())
app.use(function(req,res,next){
    // make markdown available
    res.locals.filterUserHTML = function(content){
        return sanitizeHTML( markdown.parse(content),{allowedTags:['p','br','ul','ol','li','strong','bold','i','em','h1','h2','h3','h4','h5','h6'],allowedAttributes:{}})
    }
    // make all error and success available everywhere in flash
    res.locals.errors =req.flash("errors")
    res.locals.success =req.flash("success")
    // make curent user id on req object
if(req.session.user){req.visitorId = req.session.user._id}else{req.visitorId=0}
    //make user session data available
res.locals.user=req.session.user
next()
})
const router =require("./router")

app.use(express.static('public'))
app.set('views','views')
app.set('view engine','ejs')
app.use('/',router)

// Global error handler – catches any thrown errors
app.use((err, req, res, next) => {
    console.error('Unexpected error:', err);
    res.status(500).send('Something went wrong.');
});
const server = require('http').createServer(app)
const io = require('socket.io')(server)
io.use(function (socket, next) {
  sessionOptions(socket.request, socket.request.res || {}, next)
})


io.on('connection',function(socket){
   if(socket.request.session.user){
     let user = socket.request.session.user
     socket.emit('welcome',{username:user.username, avatar:user.avatar})
    socket.on('chatMessageFromBrowser',function(data){
    socket.broadcast.emit('chatMessageFromServer',{message:sanitizeHTML(data.message,{allowedTags:[],allowedAttributes:{}}) ,username: user.username, avatar:user.avatar})
    })
   }
})
module.exports= server
