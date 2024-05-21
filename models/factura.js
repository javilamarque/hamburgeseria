const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
mongoose.connect('mongodb://localhost:27017/burger');

const ventaSchema = new mongoose.Schema({
    cantidad: { type: Number, required: true },
    codigo: { type: Number, required: true },
    descripcion: { type: String, required: true },
    precio: { type: Number, required: true },
    total: { type: Number, required: true },
    f_factura: { type: Date, default: Date.now, required: true },
    fact_numero: { type: Number },
    vendedor: { type: String, required: true },
    pago: { type: String, enum: ['Efectivo', 'Mercado Pago'], required: true }
});

ventaSchema.plugin(AutoIncrement, { inc_field: 'fact_numero' });

module.exports = mongoose.model('Venta', ventaSchema);