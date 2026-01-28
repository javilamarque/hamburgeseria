// models/productHistory.js
const mongoose = require('mongoose');

const productHistorySchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    action: { type: String, required: true }, // Por ejemplo: 'created', 'updated', 'deleted'
    username: { type: String, required: true }, // Guardamos el username del usuario que realizó la acción
    details: { type: Object, required: true }, // Detalles de los cambios (oldValue y newValue)
    timestamp: { type: Date, default: Date.now } // Fecha y hora de la modificación
}, { collection: 'productHistory' });

const ProductHistory = mongoose.model('ProductHistory', productHistorySchema);
module.exports = ProductHistory;