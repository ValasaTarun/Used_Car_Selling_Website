var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/mydb";
var ObjectId = require('mongodb').ObjectId;
var dbConn;
const { generateToken , decodedResult } = require('../dependencies/jwt')
MongoClient.connect(url, function (err, db) {
  if (err) throw err;
  console.log("Mongo Connection Success! Index");
  dbConn = db.db("cars_website");

});

function isLogined(){
  return (req, res,next)=>{
      // console.log(decodedResult(req.cookies.authToken))
      if(decodedResult(req.cookies.authToken)){
          if(decodedResult(req.cookies.authToken).payload.user != 'admin') next() ;
      }
      else{
          res.redirect('/users/login')
      }
  }
}

/* GET home page. */
router.get('/', isLogined() ,function(req, res, next) {
  res.render('index', { title: 'Car Selling Website' , clickLogin : false , isLogined : decodedResult(req.cookies.authToken).payload.user != 'admin'  });
});

router.get('/contact', async (req,res)=>{
  res.render('contact',{title: 'Contact Page'});
})

router.get('/register', async (req,res)=>{
  res.render('register',{title: 'Register Page'});

})

router.get('/ListedCars',isLogined(), async (req,res)=>{
  const listedCars = await dbConn.collection('listedCars').find({}).toArray();
  console.log(listedCars)
  // res.send('listedCars')
  res.render('listedCarsDisplay',{ result : listedCars , title: 'Listed Cars' , clickLogin : false , isLogined : decodedResult(req.cookies.authToken).payload.user != 'admin'  })
})

router.get('/singleCar',isLogined(),(req,res)=>{
  res.render('individualCarPage',{title: 'Contact Page'})
})

module.exports = router;
