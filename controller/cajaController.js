const Caja = require('../models/caja');
const { Decimal128 } = require('bson');


// Función para obtener los datos de la caja desde la base de datos
const obtenerDatosCaja = async () => {
    try {
        const aperturaDecimal = Decimal128.fromString(apertura.toString());
        // Coloca aquí la lógica para obtener los datos de la caja desde la base de datos
        const datosCaja = await Caja.find(); // Ejemplo de consulta a la base de datos
        return datosCaja;
    } catch (error) {
        throw new Error('Error al obtener los datos de la caja desde la base de datos.');
    }
};

exports.abrirCaja = async (req, res) => {
    const { apertura } = req.body;
    try {
        // Buscar la última caja abierta
        const ultimaCaja = await Caja.findOne().sort({ fecha_apertura: -1 });

        if (ultimaCaja) {
            // Calcular el tiempo transcurrido desde la última apertura en horas
            const horasTranscurridas = (new Date() - ultimaCaja.fecha_apertura) / (1000 * 60 * 60);

            if (horasTranscurridas < 24) {
                // Si han pasado menos de 24 horas, mostrar un mensaje indicando que la caja ya fue abierta
                return res.status(400).send('La caja ya fue abierta recientemente.');
            }
        }

        // Guardar solo el valor de apertura y la fecha de apertura en la base de datos
        await Caja.create({ apertura });
        res.status(200).send('Caja abierta correctamente.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al abrir la caja.');
    }
};

exports.renderCajaPage = async (req, res) => {
    try {
        // Obtener datos de la caja desde la base de datos
        const datosCaja = await obtenerDatosCaja();

        // Renderizar la página de caja con los datos obtenidos
        res.render('caja', {
            apertura: datosCaja.apertura,
            caja_dia: datosCaja.caja_dia,
            cierre_parcial: datosCaja.cierre_parcial,
            total_efectivo: datosCaja.total_efectivo,
            total_transferencia: datosCaja.total_transferencia
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar la página de caja.');
    }
};