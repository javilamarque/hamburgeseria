const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost:27017/burger', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const cajaSchema = new mongoose.Schema({
    apertura: { type: Number, required: true },
    t_transferencia: { type: Number, required: true },  // Ventas Transferencia
    total_ventas_dia: { type: Number, required: true }, // Ventas Efectivo
    cierre_parcial: { type: Number, default: 0 },       // Retiro Efectivo
    retiro_parcial_transferencia: { type: Number, default: 0 }, // Retiro Transferencia
    total_transferencia: { type: Number, default: 0 },  // Total Transferencia
    total_final: { type: Number, default: 0 }           // Total Dinero en Caja
});

module.exports = mongoose.model('Caja', cajaSchema);




