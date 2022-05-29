const jwt = require('jsonwebtoken')
require('dotenv').config()
// console.log(process.env.SECRET_KEY)
var token;


function generateToken(user,name){
    var payload = {
        user,
        name,
        auth : true,
    }
    token = jwt.sign({payload},process.env.SECRET_KEY,{expiresIn:'10 minutes'},{ algorithm: 'RS256'})
    console.log(payload)
    return token;
}

// generateToken()

// console.log(token)

const decodedResult = (token) => {

    const result = jwt.verify(token,process.env.SECRET_KEY,(err,decodedResult)=>{

        // err ? console.log(err.message) : console.log(decodedResult)
    //    console.log(err)
    //    console.log(decodedResult)
        return decodedResult
    })

    return result
    
}

const wait =  function(time,token){
     setTimeout( () => {
        console.log(`After ${time} Seconds`)
        decodedResult(token)
    }, time*1000);
}

// wait(3,token)

module.exports = {
    generateToken , decodedResult
}
