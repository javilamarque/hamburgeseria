const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/burger');

const cajaShema = new mongoose.Schema({
    apertura: { type: Number, require: true },
    cierre_parcial: { type: Number, require: true },
    t_caja: { type: Number, require: true },
    t_efectivo: { type: Number, require: true },
    t_tranferencia: {type: Number, require: true}
})

module.exports = mongoose.model('Caja', cajaShema)