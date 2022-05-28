var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Car Selling Website' });
});

router.get('/contact',(req,res)=>{
  res.render('contact',{title: 'Contact Page'});
})

module.exports = router;
