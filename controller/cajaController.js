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
                    alert('La Caja aún se Encuentra Cerrada! ');
                    window.location.href = '/sales';
                </script>
            `);
        }

        const valorApertura = parseFloat(datosCaja.apertura);

        const { totalEfectivo, totalTransferencia } = await exports.calcularTotalesVentasDia();

        const totalFinal = valorApertura + totalEfectivo - parseFloat(datosCaja.cierre_parcial);

        const formatDecimal = (num) => (typeof num === 'number' && !isNaN(num)) ? num.toFixed(2) : '';

        const caja = {
            apertura: formatDecimal(valorApertura),
            cierre_parcial: formatDecimal(parseFloat(datosCaja.cierre_parcial)),
            t_transferencia: formatDecimal(totalTransferencia),
            total_ventas_dia: formatDecimal(totalEfectivo),
            total_final: formatDecimal(totalFinal),
            fecha_apertura: datosCaja.fecha_apertura ? datosCaja.fecha_apertura.toISOString() : ''
        };

        res.render('caja', { caja });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar la página de caja.');
    }
};

exports.procesarCierreParcial = async (req, res) => {
    try {
        const { cierre_parcial } = req.body;

        if (isNaN(parseFloat(cierre_parcial))) {
            return res.status(400).send('El valor de cierre parcial no es un número válido.');
        }

        const datosCaja = await exports.obtenerDatosCaja();

        datosCaja.cierre_parcial += parseFloat(cierre_parcial);
        datosCaja.total_final = datosCaja.apertura + datosCaja.total_ventas_dia - datosCaja.cierre_parcial;

        await datosCaja.save();

        res.status(200).send('Cierre parcial procesado correctamente.');
    } catch (error) {
        console.error('Error al procesar el cierre parcial:', error);
        res.status(500).send('Error al procesar el cierre parcial.');
    }
};