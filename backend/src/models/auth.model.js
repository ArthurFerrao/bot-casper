const mongoose = require('mongoose');

const AuthSchema = new mongoose.Schema({
    token:{
        type: String,
        required: true,
    }
});

const Auth = mongoose.model('Auth', AuthSchema);

module.exports = Auth;