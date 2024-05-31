const express = require('express');
const router = express.Router();
const comboController = require('../controller/comboController')

router.get('/createCombo');

router.get('/sales/products', comboController.getProducts)




module.exports = router;