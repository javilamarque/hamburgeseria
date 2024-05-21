const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/burger');

const userSchema = new mongoose.Schema({
    username: { type: String,  required: true },
    password: { type: String, require: true }
}, { collection: 'user' }); // Especifica el nombre de la colección

userSchema.methods.comparePassword = function (candidatePassword) {
    return this.password === candidatePassword;
};

const User = mongoose.model("User", userSchema);
module.exports = User;