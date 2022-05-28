var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/mydb";
var dbConn

function returnCon(){
    return MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        console.log("Database created!");
        dbConn = db.db("realdb");
        return db.db("realdb");
      });
}

module.exports = {
    returnCon
}