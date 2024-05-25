const Caja = require('../models/caja');
const VentaModel = require('../models/venta');

// Función para obtener los datos de la caja desde la base de datos
exports.obtenerDatosCaja = async () => {
    try {
        // Obtener los datos de la última caja abierta
        const datosCaja = await Caja.findOne().sort({ fecha_apertura: -1 });
        return datosCaja;
    } catch (error) {
        throw new Error('Error al obtener los datos de la caja desde la base de datos.');
    }
};

exports.abrirCaja = async (req, res) => {
    const { apertura } = req.body;
    console.log('Valor de apertura recibido:', apertura);
    try {
        const ultimaCaja = await Caja.findOne().sort({ fecha_apertura: -1 });

        if (ultimaCaja) {
            const horasTranscurridas = (new Date() - ultimaCaja.fecha_apertura) / (1000 * 60 * 60);
            if (horasTranscurridas < 24) {
                return res.status(400).send('La caja ya fue abierta recientemente.');
            }
        }

        // Guardar el valor de apertura como un número en la base de datos
        await Caja.create({ apertura: parseFloat(apertura) });
        res.status(200).send('Caja abierta correctamente.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al abrir la caja.');
    }
};

exports.calcularTotalesVentasDia = async () => {
    try {
        // Obtener la fecha actual
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Buscar todas las ventas del día actual
        const ventasDelDia = await VentaModel.find({ f_factura: { $gte: today } });

        // Inicializar totales
        let totalEfectivo = 0;
        let totalTransferencia = 0;

        // Sumar los totales de las ventas del día según el tipo de pago
        ventasDelDia.forEach(venta => {
            if (venta.pago === 'Mercado Pago') {
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
            return res.status(404).send('No hay datos de caja disponibles.');
        }

        const valorApertura = parseFloat(datosCaja.apertura);

        // Calcular los totales de ventas del día
        const { totalEfectivo, totalTransferencia } = await exports.calcularTotalesVentasDia();

        const totalFinal = valorApertura + totalEfectivo 

        const formatDecimal = (num) => {
            if (typeof num === 'number' && !isNaN(num)) {
                return num.toFixed(2);
            } else {
                return '';
            }
        };

        const caja = {
            apertura: formatDecimal(valorApertura),
            cierre_parcial: datosCaja.cierre_parcial !== undefined ? formatDecimal(parseFloat(datosCaja.cierre_parcial)) : '',
            t_transferencia: formatDecimal(totalTransferencia),
            total_ventas_dia: formatDecimal(totalEfectivo),
            total_final: formatDecimal(totalFinal),
            fecha_apertura: datosCaja.fecha_apertura ? datosCaja.fecha_apertura.toISOString() : ''
        };

        console.log('Valores de la caja:', caja);
        res.render('caja', { caja });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar la página de caja.');
    }
};