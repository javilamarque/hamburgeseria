const express = require('express');
const router = express.Router();
const productController = require('../controller/productController');

// Rutas para los productos
router.get('/products', productController.getAllProducts);
router.post('/products', productController.createProduct);
router.get('/products/:codigoDeBarras/edit', productController.getEditProductPage);
router.put('/products/:codigoDeBarras', productController.updateProduct);
router.delete('/products/:codigoDeBarras', productController.deleteProductByBarcode);
router.get('/products/:codigoDeBarras', productController.getProductByBarcode);


module.exports = router;