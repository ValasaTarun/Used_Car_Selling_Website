var express = require('express');
var router = express.Router();
const { generateToken , decodedResult } = require('../dependencies/jwt')
const { returnDate } = require('../dependencies/date');
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/cars_website";
var ObjectId = require('mongodb').ObjectId;
var dbConn;
MongoClient.connect(url, function (err, db) {
  if (err) throw err;
  console.log("Mongo Connection Success! Admin");
  dbConn = db.db("cars_website");

});



function isLogined(){
    return (req, res,next)=>{
        // console.log(decodedResult(req.cookies.authToken))
        if(decodedResult(req.cookies.adminAuthToken)){
            if(decodedResult(req.cookies.adminAuthToken).payload.user == 'admin') next() ;
        }
        else{
            res.redirect('/admin/login')
        }
    }
}

function checkifEmpty(array){
    if(array.length != 0 ) return false
    return true
}

router.get('/',isLogined() , async (req,res)=>{

    let needApproval;
    try{
        needApproval =  await dbConn.collection('listedCars').find({isApproved:'false'}).toArray()
        // console.log(needApproval)
        // res.send('HomePage')
    }
    catch(error){
        console.log(`Error Occured : ${error}`)
    }
    res.render('adminHome',{result:needApproval,title: 'Admin Car Selling Website',isLogined : true,admin:true,clickLogin : false })

})

router.post('/validate',(req,res)=>{

    // console.log(req.body)
    const name = req.body.name , pwd = req.body.password;
    if(name == 'admin' && pwd == 'admin'){
        token = generateToken('admin','');
        res.cookie('adminAuthToken',token)
        res.redirect('/admin/')
    }
    else{
        res.redirect('/admin/login')
    }

})

router.get('/login',(req,res)=>{

    res.render('index',{admin : true , title: 'Admin Car Selling Website' , clickLogin : true , isLogined : false ,result : []});

})

router.get('/logout',(req,res)=>{

    if(decodedResult(req.cookies.adminAuthToken)){

        res.clearCookie('adminAuthToken')
        res.redirect('/admin/login');
        
    }else{
        res.send('<center><h1>Already Logged Out</h1></center>')
    }
   
})

router.get('/approve/:pId/:decision',isLogined(),async (req,res)=>{
    const pName = req.params.pId;
    const decision = req.params.decision;
    let result;
    if(decision == 'yb21jdi'){
        try {
            let temp = await dbConn.collection('listedCars').findOne({'_id':ObjectId(pName)});
            temp.isApproved = 'true'
            result = await dbConn.collection('listedCars').updateOne({'_id':ObjectId(pName)},{$set : temp});
        } catch (error) {
            console.log(`Error Occured : ${error}`)
        }
       
    }
    else{
        try {
            result = await dbConn.collection('listedCars').deleteOne({'_id':ObjectId(pName)});
        } catch (error) {
            console.log(`Error Occured : ${error}`)
        }
    }
    // console.log(pName,decision,result)

    res.redirect('/admin/')
})

router.get('/data/:user',isLogined(), async (req,res)=>{

    let user = req.params.user;
    let result ;
   

   if(user == 'sellers'){

    try {
        result = await dbConn.collection('sellers').find({}).toArray()
    } catch (error) {
        console.log(`Error Occured : ${error}`)
    }

}
   else{

    try {
        result = await dbConn.collection('buyers').find({}).toArray()
    } catch (error) {
        console.log(`Error Occured : ${error}`)
    }

}
    
    // console.log(result)

    res.render('clientsDisplay',{result, user,title: 'Admin Car Selling Website',isLogined : true,admin:true,clickLogin : false})

})

router.get('/data',isLogined(), async (req,res)=>{

    let noOfOwners
    let noOfCustomers
    let pendingApprovals
    let noOfListedProperties

    try {
        
        noOfOwners = await dbConn.collection('sellers').aggregate([
            {
                $count : 'total',
            },
        ]).toArray()
    
        noOfCustomers = await dbConn.collection('buyers').aggregate([
            {
                $count : 'total',
            },
        ]).toArray()
    
        pendingApprovals = await dbConn.collection('listedCars').aggregate([
            {
                $match: {
                    isApproved:'false',
                },
            },
            {
                $count : 'total'
            }
        ]).toArray()
    
        noOfListedProperties = await dbConn.collection('listedCars').aggregate([
            {
                $count : 'total',
            }
        ]).toArray()

    } catch (error) {
        console.log(`Error Occured : ${error}`)
    }

    

    // console.log(noOfCustomers,noOfOwners,pendingApprovals,noOfListedProperties)


    let dataToSend = {
        noOfCustomers:         checkifEmpty(noOfCustomers) ? 0 : noOfCustomers[0].total ,
        noOfOwners:            checkifEmpty(noOfOwners) ? 0 : noOfOwners[0].total,
        pendingApprovals:      checkifEmpty(pendingApprovals) ? 0 : pendingApprovals[0].total,
        noOfListedProperties:  checkifEmpty(noOfListedProperties) ? 0 : noOfListedProperties[0].total,
    } 

    // console.log(dataToSend)

    dataToSend = Object.values(dataToSend)
    // console.log(dataToSend)

    res.json(dataToSend)

})

router.get('/loginHistory/:user/:type',isLogined(),  async (req,res)=>{

    const user = req.params.user;
    const type = req.params.type;
    let result;
    try {
        result = await dbConn.collection(type).findOne({name:user})
    } catch (error) {
        console.log(`Error Occured : ${error}`)
    }

    // console.log(result)
    // console.log(result.loginData)

    res.render('loginDataDisplay',{result:result.loginData,user,title: 'Admin Car Selling Website',isLogined : true,admin:true,clickLogin : false})

})














module.exports = router;