const Caja = require('../models/caja');
const Venta = require('../models/venta');

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

        // Guardar el valor de apertura como una cadena en la base de datos
        await Caja.create({ apertura: apertura.toString() });
        res.status(200).send('Caja abierta correctamente.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al abrir la caja.');
    }
};
exports.renderCajaPage = async (req, res) => {
    try {
        const datosCaja = await Caja.findOne().sort({ fecha_apertura: -1 });

        if (!datosCaja) {
            return res.status(404).send('No hay datos de caja disponibles.');
        }

        const valorApertura = parseFloat(datosCaja.apertura);

        const ventasDelDia = await Venta.find({ f_factura: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } });

        const totalVentasDia = ventasDelDia.reduce((total, venta) => {
            return total + venta.total;
        }, 0);

        const totalFinal = valorApertura + totalVentasDia;

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
            t_transferencia: datosCaja.t_transferencia !== undefined ? formatDecimal(parseFloat(datosCaja.t_transferencia)) : '',
            total_ventas_dia: formatDecimal(totalVentasDia),
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