const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const comboSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    codigoBarra: { type: String, required: true },
    precio: { type: Number, required: true },
    productos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }]
});

const Combo = mongoose.model('Combo', comboSchema);

module.exports = Combo;