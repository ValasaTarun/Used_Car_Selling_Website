var bcrypt = require('bcryptjs');

function hashPassword (password){
    if(password == ''){
        return ''
    }
    const salt = bcrypt.genSaltSync();
    return bcrypt.hashSync(password,salt);
}

function comparePasswords(entered, hashed){
    return bcrypt.compareSync(entered,hashed);
}

module.exports={
    hashPassword,comparePasswords
};