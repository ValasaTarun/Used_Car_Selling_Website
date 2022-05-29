function returnDate(){
    var indianTime = new Date(new Date()).toLocaleString(undefined, {timeZone: 'Asia/Kolkata'});
    return indianTime;
}

module.exports = {
    returnDate
}