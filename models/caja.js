const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost:27017/burger', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const cajaSchema = new Schema({
    apertura: { type: Number, required: true },
    cierre_parcial: { type: Number, default: 0 },
    t_transferencia: { type: Number, default: 0 },
    total_ventas_dia: { type: Number, default: 0 },
    total_final: { type: Number, default: 0 },
    fecha_apertura: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Caja', cajaSchema);




