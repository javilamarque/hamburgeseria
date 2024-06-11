const express = require('express');
const router = express.Router();
const cajaController = require('../controller/cajaController');
const ensureAuthenticated = require('../middlewares/authMiddleware');

// Usar el middleware para todas las rutas de caja
router.use('/caja', ensureAuthenticated);

// Ruta para manejar la solicitud POST para abrir la caja
router.post('/caja/apertura', cajaController.abrirCaja);
router.post('/procesarCierreParcial', cajaController.procesarCierreParcial);

router.post('/procesarRetiroTransferencia', cajaController.procesarRetiroTransferencia);

// Ruta para manejar la solicitud GET para la página de caja
router.get('/caja', cajaController.renderCajaPage);
router.get('/caja', cajaController.obtenerDatosCaja);

//CERRAR CAJA
router.post('/cerrarCaja', cajaController.cerrarCaja);


module.exports = router;