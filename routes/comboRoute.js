const express = require('express');
const router = express.Router();
const comboController = require('../controller/comboController')

router.get('/createCombo');

router.get('/sales/products', comboController.getProducts)

// Ruta para la página de inicio del boton cancelar
router.get('/home', (req, res) => {
    res.render('home');
});



module.exports = router;