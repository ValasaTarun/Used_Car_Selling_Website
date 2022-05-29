var express = require('express');
var router = express.Router();
const { hashPassword, comparePasswords } = require('../dependencies/hashing')
const { generateToken , decodedResult } = require('../dependencies/jwt')
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/mydb";
var ObjectId = require('mongodb').ObjectId;
var dbConn;
MongoClient.connect(url, function (err, db) {
  if (err) throw err;
  console.log("Mongo Connection Success! Users");
  dbConn = db.db("cars_website");

});


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/login',(req,res)=>{
  console.log(req.body);
  res.send('<center><h1> Login Form Submitted </center></h1>');
})

router.post('/register',async (req,res)=>{

  console.log(JSON.parse(JSON.stringify(req.body)));
  req.body["loginData"] = [];
  console.log(hashPassword(req.body.pwd));
  req.body.pwd = hashPassword(req.body.pwd);
  console.log(JSON.parse(JSON.stringify(req.body)));

  const insertRecord = JSON.parse(JSON.stringify(req.body));
  let collection = req.body.UserType == 'Seller' ? 'sellers' : 'buyers' 
  const result = await dbConn.collection(collection).insertOne(insertRecord);
  console.log(result);

  res.send('<center><h1> Register Form Submitted </center></h1>');

})

module.exports = router;
