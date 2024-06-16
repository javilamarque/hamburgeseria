const express = require('express');
const router = express.Router();
const productController = require('../controller/productController');

// Rutas para los productos
//router.get('/products', productController.getAllProducts);
router.post('/products', productController.createProduct);
router.get('/products/:codigoDeBarras/edit', productController.getEditProductPage);
router.put('/products/:codigoDeBarras', productController.updateProduct);
router.delete('/products/:codigoDeBarras', productController.deleteProductByBarcode);
router.get('/products', productController.renderProductsPage);
router.get('/products/search', productController.searchProduct);

// Rutas para los productos
router.get('/products/:codigoDeBarras/edit', productController.getEditProductPage);
router.put('/products/:codigoDeBarras', productController.updateProduct);

// Ruta para buscar un producto por código de barras
router.get('/product/barcode/:cod_barra', productController.getProductByBarcode);


module.exports = router;