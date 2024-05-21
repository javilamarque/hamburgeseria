const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/burger');

const productSchema = new mongoose.Schema({
    cod_barra: { type: Number, required: true, unique: true },
    descripcion: { type: String, required: true },
    stock: { type: Number, default: 0 },
    costo: { type: Number, required: true },
    precio_venta: { type: Number, required: true },
    fecha: { type: Date, default: Date.now }
}, { collection: 'products' });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;