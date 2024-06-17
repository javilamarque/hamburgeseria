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

        if (apertura < 0) {
            return res.status(400).json({ message: 'La apertura no puede estar en negativo' });
        }

        if (apertura === 0) {
            return res.status(400).json({ message: 'La apertura es 0, se debe pedir al administrador que abra la caja' });
        }

        // Obtener la caja cerrada más reciente
        const ultimaCajaCerrada = await Caja.findOne({ 'cerrada.total_dinero_en_caja': { $exists: true } }).sort({ 'cerrada.fecha_cierre': -1 });

        let nuevaApertura = 0;
        let transferenciaAnterior = 0;
        let totalVentasDiaAjustado = 0;
        if (ultimaCajaCerrada) {
            nuevaApertura = ultimaCajaCerrada.cerrada.total_dinero_en_caja;
            transferenciaAnterior = ultimaCajaCerrada.cerrada.total_transferencia;
            totalVentasDiaAjustado = ultimaCajaCerrada.cerrada.total_ventas_dia - ultimaCajaCerrada.cerrada.cierre_parcial_efectivo;
        }

        // Si no se proporciona un valor de apertura, usar el total de la última caja cerrada
        const aperturaFinal = apertura !== undefined && apertura !== null ? parseFloat(apertura) : nuevaApertura;

        const nuevaCaja = new Caja({
            apertura: aperturaFinal,
            t_transferencia: transferenciaAnterior,
            total_ventas_dia: totalVentasDiaAjustado,
            cierre_parcial: 0,
            retiro_parcial_transferencia: 0,
            total_transferencia: 0,
            total_final: aperturaFinal, // Inicializar total_final con el mismo valor que aperturaFinal
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
                    window.location.href = '../admin/home';
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

        res.render('caja', { caja, cajasCerradas, fechaCierre, userRole: req.session.userRole });
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

        const nuevoCierreParcial = caja.cierre_parcial + parseFloat(cierre_parcial);
        const nuevoTotalFinal = caja.apertura + caja.total_ventas_dia - nuevoCierreParcial;

        if (nuevoTotalFinal < 0) {
            return res.status(400).json({ message: 'El cierre parcial no puede dejar el total final en negativo' });
        }

        caja.cierre_parcial = nuevoCierreParcial;
        caja.total_final = nuevoTotalFinal;

        await caja.save();
        await exports.obtenerDatosCaja(req, res);
    } catch (error) {
        console.error('Error al procesar el cierre parcial:', error);
        res.status(500).json({ message: 'Error al procesar el cierre parcial' });
    }
};

exports.procesarRetiroTransferencia = async (req, res) => {
    try {
        const { retiro_transferencia } = req.body;
        const caja = await Caja.findOne().sort({ fecha_apertura: -1 });

        if (!caja) {
            return res.status(404).json({ message: 'No se encontró la caja' });
        }

        const nuevoRetiroParcialTransferencia = caja.retiro_parcial_transferencia + parseFloat(retiro_transferencia);
        const nuevoTotalTransferencia = caja.t_transferencia - nuevoRetiroParcialTransferencia;
        const nuevoTotalFinal = caja.apertura + caja.total_ventas_dia - caja.cierre_parcial - nuevoRetiroParcialTransferencia;

        if (nuevoTotalTransferencia < 0) {
            return res.status(400).json({ message: 'El retiro parcial de transferencia no puede dejar Total Transferencia en negativo' });
        }

        caja.retiro_parcial_transferencia = nuevoRetiroParcialTransferencia;
        caja.total_transferencia = nuevoTotalTransferencia;
        caja.total_final = nuevoTotalFinal;

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
        const totalDineroEnCaja = datosCaja.total_final

        // Crear objeto de caja cerrada con valores de caja abierta
        const cajaCerrada = {
            apertura: valorApertura,
            t_transferencia: datosCaja.t_transferencia,
            total_ventas_dia: datosCaja.total_ventas_dia,
            cierre_parcial_efectivo: datosCaja.cierre_parcial,
            retiro_parcial_transferencia: datosCaja.retiro_parcial_transferencia,
            total_transferencia: datosCaja.total_transferencia,
            total_dinero_en_caja: totalDineroEnCaja, // Ajustar total_dinero_en_caja
            fecha_cierre: moment().format('dddd, D MMMM YYYY, HH:mm:ss')
        };

        datosCaja.cerrada = cajaCerrada;


        // Guardar la caja cerrada en la base de datos
        await cajaCerradas.create(cajaCerrada);

        // Resetear valores
        datosCaja.cierre_parcial = 0;
        datosCaja.retiro_parcial_transferencia = 0;

        await datosCaja.save();

        await exports.updateCaja();

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
            console.warn('No se encontró una caja cerrada updateCaja.');
            return; // No hay caja cerrada, nada que actualizar
        }

        const totalDineroEnCaja = cajaCerrada.cerrada.total_dinero_en_caja;
        const totalTransferencia = cajaCerrada.cerrada.total_transferencia;
        const totalVentasDia = cajaCerrada.cerrada.total_ventas_dia - cajaCerrada.cerrada.cierre_parcial_efectivo

        cajaAbierta.apertura = totalDineroEnCaja;
        cajaAbierta.t_transferencia = totalTransferencia;
        cajaAbierta.total_ventas_dia = totalVentasDia;
        await cajaAbierta.save();
    } catch (error) {
        console.error('Error al actualizar la caja abierta:', error.message);
    }
};
