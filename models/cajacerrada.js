const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/burger', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const cajaCerradasSchema = new mongoose.Schema({
    apertura: { type: Number, required: true },
    t_transferencia: { type: Number, required: true },
    total_ventas_dia: { type: Number, required: true },
    cierre_parcial_efectivo: { type: Number, default: 0 },
    retiro_parcial_transferencia: { type: Number, default: 0 },
    total_transferencia: { type: Number, default: 0 },
    total_dinero_en_caja: { type: Number, default: 0 },
    fecha_cierre: { type: Date, default: Date.now, required: true },
});

module.exports = mongoose.model('cajaCerradas', cajaCerradasSchema);