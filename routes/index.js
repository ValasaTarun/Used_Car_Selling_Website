var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/cars_website";
var ObjectId = require('mongodb').ObjectId;
var dbConn;
const { generateToken , decodedResult } = require('../dependencies/jwt')
const { spawn } = require('child_process');
let resultArray , resultObj;
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
  // console.log(listedCars)
  // res.send('listedCars')
  res.render('listedCarsDisplay',{ result : listedCars , title: 'Listed Cars' , clickLogin : false , isLogined : decodedResult(req.cookies.authToken).payload.user != 'admin'})
})

router.get('/singleCar/:carId',isLogined(), async (req,res)=>{
  // console.log(req.params)
  const carId = req.params.carId;
  const result = await dbConn.collection('listedCars').findOne({_id:ObjectId(carId)})
  // console.log(result)
  res.render('individualCarPage',{title: 'Contact Page',result,isLogined : decodedResult(req.cookies.authToken).payload.user != 'admin' }) 
})

router.get('/edit/:carId',async (req,res)=>{

  // console.log(req.params)
  const result = await dbConn.collection('listedCars').findOne({'_id':ObjectId(req.params.carId)});
  const cities = await dbConn.collection('cities').find({}).toArray();
  const companies = await dbConn.collection('companies').find({}).toArray();
  const years = await dbConn.collection('years').find({}).toArray();
  let models = await dbConn.collection('carModels').findOne({'company':result.company});
  models = models.models
  // console.log(result)
  
  res.render('addCar',{title: 'List Car Page',result,cities ,companies,models,years});

})

router.get('/form',(req,res)=>{

  const app_py = spawn('python3',['./python_scripts/app.py'])

  const appPromsie = new Promise((resolve,reject)=>{

    app_py.stdout.on('data',(data)=>{

      resultArray = data.map((element) => element)
      // console.log(JSON.parse(resultArray.toString()))
      resultObj =  JSON.parse(resultArray.toString())
      // console.log(resultObj)

      // for(const [key,value] of Object.entries(resultObj)){
      //     console.log(`key = ${key} , value = ${typeof(value)}`)
      // }

      for(const [key,value] of Object.entries(resultObj)){
          resultObj[key] = value.split(',')
      }

      // console.log(resultObj)

        resolve(resultObj)
      //   resolve('OK')
    })

    app_py.stderr.on('data',(err)=>{
         reject(console.log(`Error : ${err} `))
    })
  
    app_py.on('close',(code)=>{
        console.log('Exited with code' , code) 
    })

  }).then((result)=>{
      console.log(typeof(result.companies))
      res.render('form',{ result ,  })
  }).catch((error)=>{
      console.log('Error' , error) 
      res.send(`<center><h1> ${error} </center></h1>`)
  })

  
})

router.post('/predict',(req,res)=>{

  const predictFile = spawn('python3',['./python_scripts/predict.py',JSON.stringify(req.body)])

  const extPromise = new Promise((resolve,reject)=>{
      
      resultObj = ''
      predictFile.stdout.on('data',  (data)=>{

          // resultArray = data.map((element) => element)
          // console.log(JSON.parse(resultArray.toString()))
          // resultObj =  JSON.parse(resultArray.toString())

          // for(const [key,value] of Object.entries(resultObj)){
          //     console.log(`key = ${key} , value = ${value}`)
          // }

          console.log(`stdout--> : ${ data }`)
         
          
      })

      predictFile.stderr.on('data',(err)=>{
          reject(console.log(`Error : ${err} `))
      })
      
      predictFile.on('close',(code)=>{
          resolve(resultObj)
         console.log('Exited with code' , code) 
      })

  }).then((result)=> {
      // console.log(result)
      // res.render('submitted',{title:'Data Page',contentHeading : 'Dynamic Content', result})
      res.send('Ok')
  })
  .catch((error) => {
      console.log(error)
      // res.render('submitted',{title:'Data Page',contentHeading : 'Dynamic Content', result:{Error:'Error'}})
      res.send('Error')
  })

  // console.log(req.body)

})


module.exports = router;
