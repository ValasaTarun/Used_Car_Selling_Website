var express = require('express');
var router = express.Router();
const { hashPassword, comparePasswords } = require('../dependencies/hashing')
const { generateToken , decodedResult } = require('../dependencies/jwt')
const { returnDate } = require('../dependencies/date');
const multer = require('multer');
var path = require('path');
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/cars_website";
var ObjectId = require('mongodb').ObjectId;
var dbConn;
MongoClient.connect(url, function (err, db) {
  if (err) throw err;
  console.log("Mongo Connection Success! Users");
  dbConn = db.db("cars_website");

});


const storage = multer.diskStorage({
  destination : './public/uploads',
  filename:function(req,file,cb){
      cb(null,file.fieldname + '_' + Date.now() + path.extname(file.originalname));
  }
})

const upload = multer({
  storage:storage,
  limits:{fileSize:10000000},
  fileFilter:function(req,file,cb){
      checkFileType(file,cb);
  }
})

function checkFileType(file, cb){

  const filetypes = /jpeg|jpg|png/;

  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  const mimetype = filetypes.test(file.mimetype);

  if(mimetype && extname){
    return cb(null,true);
  } else {
    cb('Error iamges only');
  }
}


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
    
    res.render('index', {admin : false , title: 'Car Selling Website' , clickLogin : true , isLogined : false ,result : [] });
  }
 
})

router.get('/listCar',isLogined(), async (req,res)=>{
  if(decodedResult(req.cookies.authToken).payload.user == 'sellers'){
    const cities = await dbConn.collection('cities').find({}).toArray();
    const companies = await dbConn.collection('companies').find({}).toArray();
    const years = await dbConn.collection('years').find({}).toArray();

    // console.log(cities)
    res.render('addCar',{title: 'List Car Page',result : '',cities ,companies,models: "",years });
    // res.send('<center><h1> You Have to be a Seller to List the Car </center></h1>')
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

router.post('/addCar',isLogined(),upload.single('carImage'), async (req,res)=>{
  // console.log(req.body)
  req.body['listedBy'] = decodedResult(req.cookies.authToken).payload.name
  req.body['timeStamp'] = returnDate();
  req.body['isApproved'] = "false";
  
  const insertRecord = JSON.parse(JSON.stringify(req.body));
  console.log(insertRecord);
  // const result = await dbConn.collection('listedCars').insertOne(insertRecord);
  // console.log(result); 

  if(req.body.carId){
    console.log('---------------> carId')
    // console.log('---------------> from addProeprty')
    // console.log(property)
    // console.log('---------------> body')
    console.log(req.body)
    

    if(req.file){
      insertRecord.carImage = req.file.filename
    }
    else{
      const result = await dbConn.collection('listedCars').findOne({ "_id": ObjectId(req.body.carId)});
      console.log(result)
      insertRecord.carImage = result.carImage;
    }

    var temp = { $set: insertRecord }  
    await dbConn.collection("listedCars").updateOne({ "_id": ObjectId(req.body.carId) }, temp)
    console.log("1 row is edited");
    res.redirect('/ListedCars')
    
  }
  else{

    console.log('---------------> from Car')
    console.log('---------------> body')

      if(req.file){
        console.log(req.file)
        console.log(req.file.filename)
        insertRecord.carImage = req.file.filename
      }
      
      const result = await dbConn.collection('listedCars').insertOne(insertRecord)
      console.log(result)
      res.redirect('/ListedCars')
  }


})

router.post('/emailTaken', async (req,res,next)=>{

  console.log(req.body)

  const result1 = await dbConn.collection('buyers').findOne(req.body);
  const result2 = await dbConn.collection('sellers').findOne(req.body);
  if(result1){
    res.send('1')
  }
  else if(result2){
    res.send('2')
  }
  else{
    res.send('no')
  }
  // console.log(result1,result2)
})

router.post('/pwdTaken',async (req,res)=>{

  // console.log(req.body)

  let result;
  if(req.body.user == '1'){
     result = await dbConn.collection('buyers').findOne({email:req.body.email});
  }
  else if (req.body.user == '2'){
     result = await await dbConn.collection('sellers').findOne({email:req.body.email});
  }

  const bool = await comparePasswords(req.body.pwd, result.password);
  console.log(bool)
  if(bool){
    res.send('ok')
  }
  else{
    res.send('no')
  }
  // console.log(bool)
})




module.exports = router;
