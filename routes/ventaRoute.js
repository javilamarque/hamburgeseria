const express = require('express');
const router = express.Router();
const ventaController = require('../controller/ventaController');

router.get('/sales', ventaController.renderSalePage);
router.post('/sales', ventaController.createSale);

router.get('/viewSales', ventaController.renderSaleViews);

router.get('/sales/products', ventaController.getProducts);
router.get('/users', ventaController.getUsers);
router.post('/modifyQuantity', ventaController.modifyQuantity);

// Nuevas rutas para manejar la apertura del modal y la selección de productos
router.get('/openModal', ventaController.abrirModal);
router.post('/selectProduct', ventaController.seleccionarProducto);

module.exports = router;
