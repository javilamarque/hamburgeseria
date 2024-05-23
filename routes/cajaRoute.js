const express = require('express');
const router = express.Router();
const cajaController = require('../controller/cajaController');


// Ruta para manejar la solicitud POST para abrir la caja
router.post('/caja/apertura', cajaController.abrirCaja);

// Ruta para manejar la solicitud GET para la página de caja
router.get('/caja', cajaController.renderCajaPage);

module.exports = router;