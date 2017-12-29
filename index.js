var express = require('express')
var app = express()
var fs = require('fs')
var bodyParser = require('body-parser')
var movieRouter = require('./Routes/MovieRouter.js');
// var sequelize = require('sequelize')
var ejs = require('ejs');
var ejsMate = require('ejs-mate');

var mongoose = require('mongoose')
var User = require('./models/user');
var passport = require('passport')
var LocalStrategy = require('passport-local').LocalStrategy;

console.log(movieDetails['1'])

mongoose.connect('mongodb://localhost:27017/user',function(err){
  if(err){
    console.log('Connection to MongoDB Failed!')
    console.log(err)
  }
  else{
    console.log('Connection to MongoDB Successfull!')
  }
});
 var db = mongoose.connection;
 db.once('open',function(){
   User.create({
     username:'Abhishek Srivastava',
     email: 'abhishek.srivastav@live.in',
     password: '1234'
   },function(err,user){
     if(err){
       throw err;
     }
     else{
       console.log(user);
     }
   });
   db.collection('user').drop()
   db.close()
 });


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var port = process.env.PORT || 8080;
var router = express.Router()
app.use(express.static(__dirname+'/public'));
app.set('views','./views')
app.set('view engine', 'ejs')
app.engine('ejs', ejsMate);

app.use('/',function(req,res,next){
  res.render('index');
});
app.post('/',(req,res,next)=>{
  console.log(req);
})
app.use('/movies',movieRouter)

app.listen(port,(err)=>{
  if(err)
    console.log(err)
  else
    console.log(`server up at ${port} `)
})
