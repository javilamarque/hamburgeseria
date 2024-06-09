const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
mongoose.connect('mongodb://localhost:27017/burger');
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    role: {
        type: String, required: true,
        enum: ['empleado', 'admin'], default: 'empleado'
    }
}, { collection: 'user' });

userSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);
module.exports = User;