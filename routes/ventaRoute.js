const express = require('express');
const router = express.Router();
const ventaController = require('../controller/ventaController');

// Ruta para mostrar la página de ventas
router.get('/sale', ventaController.renderSalePage);

// Ruta para crear una venta
router.post('/sales', ventaController.createSale);

// Ruta para buscar productos
router.post('/sales/search', ventaController.searchProduct);

// Ruta para obtener la lista de usuarios
router.get('/users', ventaController.getUsers);

module.exports = router;
