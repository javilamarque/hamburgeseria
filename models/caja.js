const mongoose = require('mongoose');
const { Decimal128 } = require('bson');
mongoose.connect('mongodb://localhost:27017/burger');

const cajaSchema = new mongoose.Schema({
    apertura: { type: Decimal128, required: true },
    cierre_parcial: { type: Decimal128, default: 0 },
    t_caja: { type: Decimal128, default: 0 },
    t_efectivo: { type: Decimal128, default: 0 },
    t_transferencia: { type: Decimal128, default: 0 },
    fecha_apertura: { type: Decimal128, default: Date.now } // Nuevo campo para la fecha de apertura
});

// Crea el modelo de la caja basado en el esquema
const Caja = mongoose.model('Caja', cajaSchema);

// Exporta el modelo de la caja para su uso en otras partes de la aplicación
module.exports = Caja;