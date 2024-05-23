const Caja = require('../models/caja');


// Función para obtener los datos de la caja desde la base de datos
const obtenerDatosCaja = async () => {
    try {
        // Coloca aquí la lógica para obtener los datos de la caja desde la base de datos
        const datosCaja = await Caja.find(); // Ejemplo de consulta a la base de datos
        return datosCaja;
    } catch (error) {
        throw new Error('Error al obtener los datos de la caja desde la base de datos.');
    }
};

exports.abrirCaja = async (req, res) => {
    const apertura = req.body.apertura;

    try {
        // Guardar el valor de apertura en la base de datos
        await Caja.create({ apertura });
        res.status(200).send('Caja abierta correctamente.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al abrir la caja.');
    }
};

exports.renderCajaPage = async (req, res) => {
    try {
        // Coloca aquí la lógica para obtener los datos de la caja
        const datosCaja = await obtenerDatosCaja(); // Por ejemplo, función para obtener datos de la caja desde la base de datos

        // Renderiza la página de caja con los datos obtenidos
        res.render('caja', { datosCaja });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar la página de caja.');
    }
};