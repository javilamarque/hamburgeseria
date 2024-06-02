const express = require('express');
const router = express.Router();
const productController = require('../controller/productController')
const comboController = require('../controller/comboController')


// Ruta para obtener todos los productos
router.get('/sales/products', productController.getAllProducts);
router.post('/combos', comboController.createCombo); // Nueva ruta para crear combo

// Ruta para la página de inicio del botón cancelar
router.get('/home', (req, res) => {
    res.render('home');
});

module.exports = router;