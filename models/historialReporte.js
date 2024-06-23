const mongoose = require('mongoose');

const historialReporteSchema = new mongoose.Schema({
    fechaCierre: { type: Date, default: Date.now },
    ventas: [
        {
            cantidad: { type: Number, required: true },
            descripcion: { type: String, required: true },
            precio: { type: Number, required: true },
            total: { type: Number, required: true }
        }
    ],
    totalGeneral: { type: Number, required: true }
});

const HistorialReporte = mongoose.model('HistorialReporte', historialReporteSchema);
module.exports = HistorialReporte;