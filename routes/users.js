var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/login',(req,res)=>{
  console.log(req.body);
  res.send('<center><h1> Login Form Submitted </center></h1>');
})

module.exports = router;
