const express = require('express');
const router = express.Router();
const ventaController = require('../controller/ventaController');
const comboController = require('../controller/comboController');
const userController = require('../controller/userController')
const productController = require('../controller/productController');
const HistorialReporte = require('../models/historialReporte');


router.get('/sales', ventaController.renderSalePage);
router.post('/sales', ventaController.createSale);

router.get('/viewSales', ventaController.renderSaleViews);
router.get('admin/home', userController.loginUser)

router.get('/sales/products', ventaController.getProducts);
router.get('/users', ventaController.getUsers);
router.post('/modifyQuantity', ventaController.modifyQuantity);

// Ruta para obtener los detalles de un combo específico
router.get('/sales/combos/:id', comboController.getComboById);

// Definir la ruta para buscar productos por descripción
router.get('/products/search', productController.searchProduct);

// Nuevas rutas para manejar la apertura del modal y la selección de productos
router.post('/selectProduct', ventaController.seleccionarProducto);

// Ruta para eliminar facturas
router.post('/sales/anular', ventaController.anularVenta);

//REPORTES DE COMBOS Y PRODUCTOS SUMADOS CANTIDAD
router.get('/reportes', ventaController.reportesVentasProductosCombos);


// Ruta para obtener los reportes cerrados
router.get('/api/reportes-cerrados', async (req, res) => {
    try {
        const historiales = await HistorialReporte.find({}).sort({ fechaCierre: -1 });
        res.json(historiales);
    } catch (error) {
        console.error('Error al obtener los reportes cerrados:', error);
        res.status(500).send('Error al obtener los reportes cerrados.');
    }
});


router.get('/cerrar-reporte', ventaController.cerrarReporte);;

// Ruta para exportar a Excel
router.get('/exportar-excel', ventaController.exportarExcel);

module.exports = router;
