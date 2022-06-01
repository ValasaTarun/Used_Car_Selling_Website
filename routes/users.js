var express = require('express');
const res = require('express/lib/response');
var router = express.Router();
const { hashPassword, comparePasswords } = require('../dependencies/hashing')
const { generateToken , decodedResult } = require('../dependencies/jwt')
const { returnDate } = require('../dependencies/date');
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

router.get('/login',(req,res)=>{
  if(decodedResult(req.cookies.authToken)){
    res.redirect('/');
  }
  else{
    res.render('index', { title: 'Car Selling Website' , clickLogin : true , isLogined : false });
  }
 
})

router.get('/listCar',isLogined(),(req,res)=>{
  if(decodedResult(req.cookies.authToken).payload.user == 'sellers'){
    res.render('addCar',{title: 'List Car Page'});
  }
  else{
    res.send('<center><h1> You Have to be a Seller to List the Car </center></h1>')
  }
})

router.post('/register',async (req,res)=>{

  console.log(JSON.parse(JSON.stringify(req.body)));
  req.body["loginData"] = [];
  console.log(hashPassword(req.body.password));
  req.body.password = hashPassword(req.body.password)
  console.log(JSON.parse(JSON.stringify(req.body))); 

  const insertRecord = JSON.parse(JSON.stringify(req.body));
  let collection = req.body.UserType == 'Seller' ? 'sellers' : 'buyers' 
  const result = await dbConn.collection(collection).insertOne(insertRecord);
  console.log(result);

  res.send('<center><h1> Register Form Submitted </center></h1>');

})

router.post('/validate', async function(req,res,next){

  console.log(req.body)
  console.log('in Validate')
  // const hashedPassword = hashPassword(req.body.password)
  // console.log(hashedPassword)
  
  var query = { "email": req.body.email }

  const ifBuyer = await dbConn.collection('buyers').findOne(query);
  const ifSellers = await dbConn.collection('sellers').findOne(query);


  var validateUser = async (req,query,ifBuyer,ifSellers)=>{

    let result,user;
    if(ifBuyer){
      console.log('login by buyers')
      result = await dbConn.collection('buyers').findOne(query);
      user='buyers'
    }
    else if(ifSellers){
      console.log('login by sellers')
      result = await dbConn.collection('sellers').findOne(query);
      user='sellers'
    }
    else{
      console.log('admin')
    }

    const bool = await comparePasswords(req.body.password, result.password);

    if( bool ){

      console.log('compare password returns - ', bool)
      console.log('entry created')
      console.log(`login by ${req.body.username}`)
      var pushing = {
        $push: {
          'loginData': {
            $each: [`Login On : ${returnDate()}`],
            $position: 0
          }
        }
      }

      await dbConn.collection(user).updateOne(query, pushing);
      console.log('entry added');

      const data = await dbConn.collection(user).findOne(query)
      var firstOne = data.loginData[0].split(":")[0];
      var secondOne = data.loginData[1].split(":")[0]

      console.log(`first One ${firstOne} , secondOne ${secondOne}`)

      if (firstOne == secondOne){

        var pushing = {
          $push: {
            'loginData': {
              $each: [`Logout by expiration of Token `],
              $position: 1
            }
          }
        }

        await dbConn.collection(user).updateOne(query, pushing);

      }
      token = generateToken(user,result.name);
      res.cookie('authToken',token)

      res.redirect('/')

    }
    else{
      res.redirect('/users/login')
    }

  }

  validateUser(req,query,ifBuyer,ifSellers)

})

router.get('/logout',function(req,res,next){


  if (decodedResult(req.cookies.authToken)) {

    var query = { "name": decodedResult(req.cookies.authToken).payload.name }
    var pushing = {
      $push: {
        'loginData': {
          $each: [`Logout On : ${returnDate()}`],
          $position: 0
        }
      }
    }
  
    var addLogoutEntry = async (query,pushing) => {

      await dbConn.collection(decodedResult(req.cookies.authToken).payload.user).updateOne(query, pushing);
      console.log('Logout Entry Added')

    }

    addLogoutEntry(query,pushing);
    res.clearCookie('authToken')
    res.redirect('/users/login')
    console.log('sucessfult logout')
  }
  else{
    res.send('<center><h1>Already Logged Out</h1></center>')
  }
  
})

router.post('/addCar',isLogined(), async (req,res)=>{
  // console.log(req.body)
  req.body['listedBy'] = decodedResult(req.cookies.authToken).payload.name
  req.body['timeStamp'] = returnDate();
  const insertRecord = JSON.parse(JSON.stringify(req.body));
  console.log(insertRecord);
  const result = await dbConn.collection('listedCars').insertOne(insertRecord);
  console.log(result); 
  res.send(' Form Submitted ' + decodedResult(req.cookies.authToken).payload.name )


})

router.post('/addProperty',async function(req,res,next){

  let property = {
    name:req.body.name.trim(),
    description:req.body.description,
    city:req.body.city,
    area:req.body.area,
    listedBy:decodedResult(req.cookies.authToken).payload.name,
    fileLocaiton:'',
    propertyType:req.body.inlineRadioOptions,
    price:req.body.price,
    views:0,
    isApproved:'false',
  }
  const dbConn = returnCon()
  if(req.body.pkey){
    console.log('---------------> PKEY')
    // console.log('---------------> from addProeprty')
    // console.log(property)
    // console.log('---------------> body')
    console.log(req.body)
    
    if(req.file){
      property.fileLocaiton = req.file.filename
    }

    var temp = { $set: property }  
    await dbConn.collection("properties").updateOne({ "_id": ObjectId(req.body.pkey) }, temp)
    console.log("1 row is edited");
    res.redirect('/properties')
  }
  else{

    console.log('---------------> from addProeprty')
    console.log(property)
    console.log('---------------> body')
    console.log(req.body)

    if(property.name){
      
      if(req.file){
        console.log(req.file)
        console.log(req.file.filename)
        property.fileLocaiton = req.file.filename
      }
      
      const result = await dbConn.collection('properties').insertOne(property)
      console.log(result)
      res.redirect('/properties')


    }
    else{
      res.send('property not listed')
    }


  }


})


module.exports = router;
