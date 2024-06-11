const Caja = require('../models/caja');
const VentaModel = require('../models/venta');
const moment = require('moment');

// Función para obtener los datos de la caja desde la base de datos
exports.obtenerDatosCaja = async (req,res) => {
    try {
        const caja = await Caja.findOne(); // Supongo que solo hay un documento de caja
        if (!caja) {
            return res.status(404).json({ message: 'No se encontró la caja' });
        }
        caja.total_transferencia = caja.t_transferencia - caja.retiro_parcial_transferencia;
        caja.total_final = caja.apertura + caja.total_ventas_dia - caja.cierre_parcial;
        await caja.save();
        res.render('caja', { caja });
    } catch (error) {
        console.error('Error al obtener el estado de la caja:', error);
        res.status(500).json({ message: 'Error al obtener el estado de la caja' });
    }
};

exports.abrirCaja = async (req, res) => {
    try {
        const { apertura } = req.body;

        const nuevaCaja = new Caja({
            apertura: parseFloat(apertura),
            t_transferencia: 0,        // Inicializamos con 0
            total_ventas_dia: 0,       // Inicializamos con 0
            cierre_parcial: 0,
            retiro_parcial_transferencia: 0,
            total_transferencia: 0,
            total_final: parseFloat(apertura)
        });

        await nuevaCaja.save();
        res.status(200).json({ message: 'Caja abierta correctamente.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al abrir la caja.', error });
    }
};

exports.calcularTotalesVentasDia = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const ventasDelDia = await VentaModel.find({ f_factura: { $gte: today } });

        let totalEfectivo = 0;
        let totalTransferencia = 0;

        ventasDelDia.forEach(venta => {
            if (venta.tipo_pago === 'Mercado Pago') {
                totalTransferencia += venta.total;
            } else {
                totalEfectivo += venta.total;
            }
        });

        return { totalEfectivo, totalTransferencia };
    } catch (error) {
        console.error(error);
        throw new Error('Error al calcular los totales de ventas del día');
    }
};

exports.renderCajaPage = async (req, res) => {
    try {
        const datosCaja = await Caja.findOne().sort({ fecha_apertura: -1 });

        if (!datosCaja) {
            return res.status(404).send(`
                <script>
                    alert('La Caja aún se Encuentra Cerrada!');
                    window.location.href = '/sales';
                </script>
            `);
        }

        const valorApertura = parseFloat(datosCaja.apertura);

        const { totalEfectivo, totalTransferencia } = await exports.calcularTotalesVentasDia();

        const totalFinal = valorApertura + totalEfectivo - parseFloat(datosCaja.cierre_parcial);

        const formatDecimal = (num) => (typeof num === 'number' && !isNaN(num)) ? num.toFixed(2) : '';

        const caja = {
            abierta: {
                apertura: formatDecimal(valorApertura),
                t_transferencia: formatDecimal(totalTransferencia),
                total_ventas_dia: formatDecimal(totalEfectivo),
                cierre_parcial_efectivo: formatDecimal(parseFloat(datosCaja.cierre_parcial)),
                retiro_parcial_transferencia: formatDecimal(parseFloat(datosCaja.retiro_parcial_transferencia)),
                total_transferencia: formatDecimal(parseFloat(datosCaja.total_transferencia)),
                total_dinero_en_caja: formatDecimal(totalFinal)
            },
            cerrada: datosCaja.cerrada ? {
                apertura: formatDecimal(datosCaja.cerrada.apertura),
                t_transferencia: formatDecimal(datosCaja.cerrada.t_transferencia),
                total_ventas_dia: formatDecimal(datosCaja.cerrada.total_ventas_dia),
                cierre_parcial_efectivo: formatDecimal(datosCaja.cerrada.cierre_parcial_efectivo),
                retiro_parcial_transferencia: formatDecimal(datosCaja.cerrada.retiro_parcial_transferencia),
                total_transferencia: formatDecimal(datosCaja.cerrada.total_transferencia),
                total_dinero_en_caja: formatDecimal(datosCaja.cerrada.total_dinero_en_caja)
            } : null
        };

        res.render('caja', { caja, userRole: req.session.userRole });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar la página de caja.');
    }
};

// exports.renderCajaPage = async (req, res) => {
//     try {
//         const datosCaja = await Caja.findOne().sort({ fecha_apertura: -1 });

//         if (!datosCaja) {
//             return res.status(404).send(`
//                 <script>
//                     alert('La Caja aún se Encuentra Cerrada!');
//                     window.location.href = '/sales';
//                 </script>
//             `);
//         }

//         const valorApertura = parseFloat(datosCaja.apertura);

//         const { totalEfectivo, totalTransferencia } = await exports.calcularTotalesVentasDia();

//         const totalFinal = valorApertura + totalEfectivo - parseFloat(datosCaja.cierre_parcial);

//         const formatDecimal = (num) => (typeof num === 'number' && !isNaN(num)) ? num.toFixed(2) : '';

//         const caja = {
//             abierta: {
//                 apertura: formatDecimal(valorApertura),
//                 t_transferencia: formatDecimal(totalTransferencia),
//                 total_ventas_dia: formatDecimal(totalEfectivo),
//                 cierre_parcial_efectivo: formatDecimal(parseFloat(datosCaja.cierre_parcial)),
//                 retiro_parcial_transferencia: formatDecimal(parseFloat(datosCaja.retiro_parcial_transferencia)),
//                 total_transferencia: formatDecimal(parseFloat(datosCaja.total_transferencia)),
//                 total_dinero_en_caja: formatDecimal(totalFinal)
//             },
//             cerrada: datosCaja.cerrada ? {
//                 apertura: formatDecimal(datosCaja.cerrada.apertura),
//                 t_transferencia: formatDecimal(datosCaja.cerrada.t_transferencia),
//                 total_ventas_dia: formatDecimal(datosCaja.cerrada.total_ventas_dia),
//                 cierre_parcial_efectivo: formatDecimal(datosCaja.cerrada.cierre_parcial_efectivo),
//                 retiro_parcial_transferencia: formatDecimal(datosCaja.cerrada.retiro_parcial_transferencia),
//                 total_transferencia: formatDecimal(datosCaja.cerrada.total_transferencia),
//                 total_dinero_en_caja: formatDecimal(datosCaja.cerrada.total_dinero_en_caja)
//             } : null
//         };

//         res.render('caja', { caja, userRole: req.session.userRole });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Error al cargar la página de caja.');
//     }
// };


exports.procesarCierreParcial = async (req, res) => {
    try {
        const { cierre_parcial } = req.body;
        const caja = await Caja.findOne();
        if (!caja) {
            return res.status(404).json({ message: 'No se encontró la caja' });
        }
        caja.cierre_parcial += parseFloat(cierre_parcial);
        await caja.save();
        await exports.obtenerDatosCaja(req ,res); // Asegúrate de pasar res correctamente
    } catch (error) {
        console.error('Error al procesar el cierre parcial:', error);
        res.status(500).json({ message: 'Error al procesar el cierre parcial' });
    }
};

exports.procesarRetiroTransferencia = async (req, res) => {
    const { retiro_transferencia } = req.body;
    try {
        const caja = await Caja.findOne();
        caja.retiro_parcial_transferencia += parseFloat(retiro_transferencia);
        caja.total_transferencia = caja.t_transferencia - caja.retiro_parcial_transferencia;
        await caja.save();
        res.status(200).json({ message: 'Retiro parcial transferencia procesado correctamente.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al procesar el retiro parcial transferencia.' });
    }
};



exports.cerrarCaja = async (req, res) => {
    try {
        const datosCaja = await Caja.findOne().sort({ fecha_apertura: -1 });

        if (!datosCaja) {
            return res.status(404).send('No se encontró una caja abierta.');
        }

        const valorApertura = parseFloat(datosCaja.apertura);
        const { totalEfectivo, totalTransferencia } = await exports.calcularTotalesVentasDia();
        const totalDineroEnCaja = valorApertura + totalEfectivo - parseFloat(datosCaja.cierre_parcial);

        datosCaja.cerrada = {
            apertura: valorApertura,
            t_transferencia: totalTransferencia,
            total_ventas_dia: totalEfectivo,
            cierre_parcial_efectivo: datosCaja.cierre_parcial,
            retiro_parcial_transferencia: datosCaja.retiro_parcial_transferencia,
            total_transferencia: totalTransferencia,
            total_dinero_en_caja: totalDineroEnCaja,
            fecha_cierre: moment(caja.fecha_cierre).format('dddd, D MMMM YYYY, HH:mm:ss')
        };
        await datosCaja.save();

        // Renderizar la vista con los datos actualizados
        res.render('caja', { caja: datosCaja });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cerrar la caja.');
    }
};