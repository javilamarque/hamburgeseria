const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.connect('mongodb://localhost:27017/burger')

const CajaSchema = new Schema({
    apertura: { type: String, required: true },
    cierre_parcial: { type: String, default: '0.000' },
    t_transferencia: { type: String, default: '0.000' },
    fecha_apertura: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Caja', CajaSchema);




