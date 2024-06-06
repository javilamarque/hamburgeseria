const express = require('express');
const router = express.Router();
const productController = require('../controller/productController')
const comboController = require('../controller/comboController')

// Ruta para obtener todos los productos
router.get('/productos', productController.getAllProductsCombo);

// Ruta para obtener todos los productos
router.get('/sales/products', productController.getAllProducts);

// Ruta para crear un nuevo combo
router.post('/combos', comboController.createCombo);

// Ruta para editar un combo
router.put('/combos/:id', comboController.updateCombo);

// Ruta para eliminar un combo
router.delete('/combos/:id', comboController.deleteCombo);

// Ruta para obtener todos los combos
router.get('/combos', comboController.getAllCombos);

// Ruta para obtener un combo por su ID
router.get('/combos/:id', comboController.getComboById);

// Ruta para renderizar la vista viewCombos
router.get('/viewCombo', (req, res) => {
    res.render('viewCombo');
});

// Ruta para la página de inicio del botón cancelar
router.get('/home', (req, res) => {
    res.render('home');
});

module.exports = router;