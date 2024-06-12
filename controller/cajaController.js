const Caja = require('../models/caja');
const cajaCerradas = require('../models/cajacerrada')
const VentaModel = require('../models/venta');
const moment = require('moment');

// Función para obtener los datos de la caja desde la base de datos
exports.obtenerDatosCaja = async (req, res) => {
    try {
        const caja = await Caja.findOne().sort({ fecha_apertura: -1 });
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

        // Obtener la caja cerrada más reciente
        const ultimaCajaCerrada = await Caja.findOne({ 'cerrada.total_dinero_en_caja': { $exists: true } }).sort({ 'cerrada.fecha_cierre': -1 });
        const nuevaApertura = ultimaCajaCerrada ? ultimaCajaCerrada.cerrada.total_dinero_en_caja : 0;

        // Si no se proporciona un valor de apertura, usar el total de la última caja cerrada
        const aperturaFinal = apertura !== undefined && apertura !== null ? parseFloat(apertura) : nuevaApertura;

        const nuevaCaja = new Caja({
            apertura: aperturaFinal,
            t_transferencia: 0,
            total_ventas_dia: 0,
            cierre_parcial: 0,
            retiro_parcial_transferencia: 0,
            total_transferencia: 0,
            total_final: aperturaFinal,
            cerrada: null  // No se ha cerrado todavía
        });

        await nuevaCaja.save();
        res.status(200).json({ message: 'Caja abierta correctamente.' });
    } catch (error) {
        console.error('Error al abrir la caja:', error);
        res.status(500).json({ message: 'Error al abrir la caja.', error });
    }
};
exports.calcularTotalesVentasDia = async (fechaApertura) => {
    try {
        const ventasDelDia = await VentaModel.find({ f_factura: { $gte: fechaApertura } });

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
        const datosCaja = await Caja.findOne().sort({ fecha_apertura: -1 }).exec();
        if (!datosCaja) {
            return res.status(500).send(`
                <script>
                    alert('No se encontró una caja abierta');
                    window.location.href = '/sales';
                </script>
            `);
        }
        
        const valorApertura = parseFloat(datosCaja.apertura) || 0;
        const totalEfectivo = parseFloat(datosCaja.total_ventas_dia) || 0;
        const totalTransferencia = parseFloat(datosCaja.t_transferencia) || 0;
        const cierreParcial = parseFloat(datosCaja.cierre_parcial) || 0;
        const retiroParcialTransferencia = parseFloat(datosCaja.retiro_parcial_transferencia) || 0;
        const totalFinal = valorApertura + totalEfectivo - cierreParcial;

        // Calcular total_transferencia como la diferencia entre t_transferencia y retiro_parcial_transferencia
        const total_transferencia = totalTransferencia - retiroParcialTransferencia;

        const formatDecimal = (num) => (typeof num === 'number' && !isNaN(num)) ? num.toFixed(2) : '0.00';

        const caja = {
            abierta: {
                apertura: formatDecimal(valorApertura),
                t_transferencia: formatDecimal(totalTransferencia),
                total_ventas_dia: formatDecimal(totalEfectivo),
                cierre_parcial_efectivo: formatDecimal(cierreParcial),
                retiro_parcial_transferencia: formatDecimal(retiroParcialTransferencia),
                total_transferencia: formatDecimal(total_transferencia),
                total_dinero_en_caja: formatDecimal(totalFinal)
            },
            cerrada: datosCaja.cerrada ? {
                apertura: formatDecimal(parseFloat(datosCaja.cerrada.apertura)),
                t_transferencia: formatDecimal(parseFloat(datosCaja.cerrada.t_transferencia)),
                total_ventas_dia: formatDecimal(parseFloat(datosCaja.cerrada.total_ventas_dia)),
                cierre_parcial_efectivo: formatDecimal(parseFloat(datosCaja.cerrada.cierre_parcial_efectivo)),
                retiro_parcial_transferencia: formatDecimal(parseFloat(datosCaja.cerrada.retiro_parcial_transferencia)),
                total_transferencia: formatDecimal(parseFloat(datosCaja.cerrada.total_transferencia)),
                total_dinero_en_caja: formatDecimal(parseFloat(datosCaja.cerrada.total_dinero_en_caja))
            } : null
        };
        // Obtener la fecha de cierre de la caja desde los datos guardados
        const fechaCierre = datosCaja.cerrada ? datosCaja.cerrada.fecha_cierre : '';

        // Obtener todas las cajas cerradas y ordenarlas por fecha de cierre
        const cajasCerradas = await cajaCerradas.find().sort({ fecha_cierre: -1 }).exec();

        res.render('caja', { caja, cajasCerradas , fechaCierre, userRole: req.session.userRole });
    } catch (error) {
        console.error('Error al recuperar la caja:', error);
        res.status(500).json({ message: 'Error al recuperar la caja' });
    }
};

exports.procesarCierreParcial = async (req, res) => {
    try {
        const { cierre_parcial } = req.body;
        const caja = await Caja.findOne().sort({ fecha_apertura: -1 });
        if (!caja) {
            return res.status(404).json({ message: 'No se encontró la caja' });
        }
        caja.cierre_parcial += parseFloat(cierre_parcial);
        await caja.save();
        await exports.obtenerDatosCaja(req, res);
    } catch (error) {
        console.error('Error al procesar el cierre parcial:', error);
        res.status(500).json({ message: 'Error al procesar el cierre parcial' });
    }
};

exports.procesarRetiroTransferencia = async (req, res) => {
    const { retiro_transferencia } = req.body;
    try {
        const caja = await Caja.findOne().sort({ fecha_apertura: -1 });
        caja.retiro_parcial_transferencia += parseFloat(retiro_transferencia);
        caja.total_transferencia = caja.t_transferencia - caja.retiro_parcial_transferencia;
        await caja.save();
        res.status(200).json({ message: 'Retiro parcial transferencia procesado correctamente.' });
    } catch (error) {
        console.error('Error al procesar el retiro parcial transferencia:', error);
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
        const fechaApertura = datosCaja.fecha_apertura;
        const { totalEfectivo, totalTransferencia } = await exports.calcularTotalesVentasDia(fechaApertura);
        const totalDineroEnCaja = valorApertura + totalEfectivo - parseFloat(datosCaja.cierre_parcial);

        datosCaja.cerrada = {
            apertura: valorApertura,
            t_transferencia: totalTransferencia,
            total_ventas_dia: totalEfectivo,
            cierre_parcial_efectivo: datosCaja.cierre_parcial,
            retiro_parcial_transferencia: datosCaja.retiro_parcial_transferencia,
            total_transferencia: totalTransferencia,
            total_dinero_en_caja: totalDineroEnCaja,
            fecha_cierre: moment().format('dddd, D MMMM YYYY, HH:mm:ss')
        };

        datosCaja.cierre_parcial = 0;
        datosCaja.retiro_parcial_transferencia = 0; 

        // Guardar la caja cerrada en la base de datos
        await cajaCerradas.create(datosCaja.cerrada);

        await datosCaja.save();
        await exports.updateCaja();
        await datosCaja.reiniciarVentas();
        res.render('caja', { caja: datosCaja });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cerrar la caja.');
    }
};

exports.updateCaja = async () => {
    try {
        const cajaAbierta = await Caja.findOne().sort({ fecha_apertura: -1 });

        if (!cajaAbierta) {
            throw new Error('No se encontró una caja abierta.');
        }

        const cajaCerrada = await Caja.findOne({ 'cerrada.total_dinero_en_caja': { $exists: true } }).sort({ 'cerrada.fecha_cierre': -1 });

        if (!cajaCerrada) {
            throw new Error('No se encontró una caja cerrada.');
        }

        const totalDineroEnCaja = cajaCerrada.cerrada.total_dinero_en_caja;

        cajaAbierta.apertura = totalDineroEnCaja;

        await cajaAbierta.save();
    } catch (error) {
        console.error('Error al actualizar la caja abierta:', error.message);
    }
};
