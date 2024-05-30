const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

mongoose.connect('mongodb://localhost:27017/burger');

const itemSchema = new mongoose.Schema({
    cod_barra: { type: Number, required: true },
    descripcion: { type: String, required: true },
    cantidad: { type: Number, required: true },
    precio: { type: Number, required: true },
    total: { type: Number, required: true }
});

const ventaSchema = new mongoose.Schema({
    descripcion: { type: String, required: true },
    total: { type: Number, required: true },
    f_factura: { type: Date, default: Date.now, required: true },
    fac_num: { type: Number },
    vendedor: { type: String, required: true },
    tipo_pago: { type: String, enum: ['Efectivo', 'Mercado Pago'], required: true },
    cantidad: { type: Number, required: true }
});

ventaSchema.plugin(AutoIncrement, { inc_field: 'fac_num' });

const VentaModel = mongoose.model('ventaModel', ventaSchema);
module.exports = VentaModel;