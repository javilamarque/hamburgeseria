const Product = require('../models/product');
const ProductHistory = require('../models/productHistory');
const User = require('../models/user');
const moment = require('moment');

const formatMoney = (amount) => {
    return `$${amount.toFixed(2)}`; // Ajusta a 2 decimales y agrega "$"
};

// Obtener todos los productos
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.render('products', { products: products })
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};


// Obtener todos los productos
exports.getAllProductsCombo = async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products); // Devolver los productos como JSON
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};

// Función para buscar un producto por código de barras
exports.getProductByBarcode = async (req, res) => {
    const cod_barra = req.params.cod_barra.trim();
    try {
        const product = await Product.findOne({ cod_barra: cod_barra });
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        if (product.stock <= 0) {
            return res.status(400).json({ message: `El producto "${product.descripcion}" no tiene stock` });
        }
        res.json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al buscar el producto', error });
    }
};


// Crear un nuevo producto
exports.createProduct = async (req, res) => {
    const { cod_barra, descripcion, stock, costo, precio_venta, fecha } = req.body;
    try {
        const existingProduct = await Product.findOne({ cod_barra });
        if (existingProduct) {
            return res.send(`
                <script>
                    alert('Ya Existe este código de Barras!!!');
                    window.location.href = '/products';
                </script>
            `);
        }

        const newProduct = new Product({ cod_barra, descripcion, stock, costo, precio_venta, fecha });
        await newProduct.save();

        // Suponiendo que `req.user` contiene la información del usuario autenticado
        const username = req.user ? req.user.username : 'desconocido'; // Si no hay usuario autenticado, usar "desconocido"

        const historyEntry = new ProductHistory({
            productId: newProduct._id,
            action: 'created',
            username: username, // Guardar el username en lugar del userId
            details: {
                newValue: {
                    descripcion: newProduct.descripcion,
                    precio_venta: newProduct.precio_venta
                }
            }
        });
        await historyEntry.save();

        res.send(`
            <script>
                alert('Producto creado exitosamente');
                window.location.href = '/products';
            </script>
        `);
    } catch (error) {
        console.error('Error al crear el producto:', error);
        res.status(500).send(`
            <script>
                alert('Error al crear el producto');
                window.location.href = '/newProduct'; // Redirigir a la página de creación de productos en caso de error
            </script>
        `);
    }
};
// Obtener la página de edición del producto
exports.getEditProductPage = async (req, res) => {
    try {
        const codigoDeBarras = req.params.codigoDeBarras;

        const product = await Product.findOne({ cod_barra: codigoDeBarras });

        if (!product) {
            return res.status(400).json({ message: 'Producto no encontrado' });
        }

        res.render('editProduct', { product });
    } catch (error) {
        console.error('Error al obtener producto para editar:', error);
        res.status(500).json({ message: 'Error al obtener producto para editar' });
    }
};


exports.updateProduct = async (req, res) => {
    const codigoDeBarras = req.params.codigoDeBarras;
    const updateData = {
        cod_barra: req.body.cod_barra,
        descripcion: req.body.descripcion,
        stock: req.body.stock,
        costo: req.body.costo,
        precio_venta: req.body.precio_venta,
        fecha: req.body.fecha || new Date()
    };

    try {
        const oldProduct = await Product.findOne({ cod_barra: codigoDeBarras });
        if (!oldProduct) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        const updatedProduct = await Product.findOneAndUpdate(
            { cod_barra: codigoDeBarras },
            updateData,
            { new: true }
        );

        // Suponiendo que `req.user` contiene la información del usuario autenticado
        const username = req.user ? req.user.username : 'desconocido'; // Si no hay usuario autenticado, usar "desconocido"

        const historyEntry = new ProductHistory({
            productId: updatedProduct._id,
            action: 'Modificado',
            username: username, // Guardar el username en lugar del userId
            details: {
                oldValue: {
                    descripcion: oldProduct.descripcion,
                    precio_venta: oldProduct.precio_venta
                },
                newValue: {
                    descripcion: updatedProduct.descripcion,
                    precio_venta: updatedProduct.precio_venta
                }
            }
        });
        await historyEntry.save();

        res.json(updatedProduct);
    } catch (error) {
        console.error('Error al actualizar el producto:', error);
        res.status(500).json({ message: 'Error al actualizar el producto' });
    }
};


exports.deleteProductByBarcode = async (req, res) => {
    const codigoDeBarras = req.params.codigoDeBarras;
    try {
        const product = await Product.findOneAndDelete({ cod_barra: codigoDeBarras });
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        // Suponiendo que `req.user` contiene la información del usuario autenticado
        const username = req.user ? req.user.username : 'desconocido'; // Si no hay usuario autenticado, usar "desconocido"

        const historyEntry = new ProductHistory({
            productId: product._id,
            action: 'deleted',
            username: username, // Guardar el username en lugar del userId
            details: {
                oldValue: {
                    descripcion: product.descripcion,
                    precio_venta: product.precio_venta
                }
            }
        });
        await historyEntry.save();

        res.status(200).end();
    } catch (error) {
        console.error('Error al eliminar el producto:', error);
        res.status(500).json({ message: 'Error al eliminar el producto' });
    }
};


//------------------------------------------------------------------------------------------------------RENDERIZAR PAGINA PRODUCTOS ACTUALIZADOS-------------------------

exports.renderProductsPage = async (req, res) => {
    try {
        const products = await Product.find();
        moment.locale('es');
        // Formatear las fechas
        const formattedProducts = products.map(product => {
            const formattedDate = moment(product.fecha).format('dddd, D MMMM YYYY, HH:mm:ss');
            return {
                ...product._doc,
                precio_venta: formatMoney(product.precio_venta),
                fecha: formattedDate
            };
        });
        res.set('Cache-Control', 'no-store');
        res.render('products', { products: formattedProducts });
    } catch (error) {
        console.error('Error al cargar los productos:', error);
        res.status(500).send('Error al cargar los productos');
    }
};


exports.seleccionarProducto = async (req, res) => {
    try {
        const { cod_barra } = req.body;

        // Consultar el producto en la base de datos usando el código de barras
        const product = await Product.findOne({ cod_barra });

        if (!product) {
            return res.status(404).json({ message: `Producto con código ${cod_barra} no encontrado` });
        }

        // Enviar los detalles del producto al cliente
        res.json(product);
    } catch (error) {
        console.error('Error al seleccionar el producto:', error);
        res.status(500).json({ message: 'Error al seleccionar el producto' });
    }
};


//-----------------------------------------------------------------------------------------------------BUSQUEDA DE PRODUCTO------------------------------------------------------
exports.searchProduct = async (req, res) => {
    try {
        const { descripcion } = req.query;
        const products = await Product.find({ descripcion: new RegExp(descripcion, 'i') }); // Buscar productos que coincidan parcialmente con la descripción
        res.json(products);
    } catch (error) {
        console.error('Error al buscar productos:', error);
        res.status(500).json({ message: 'Error al buscar productos' });
    }
};


//-----------------------------------------------------------------------------------------------------HISTORIAL DE PRODUCTOS--------------------------------------------------// productController.js
exports.getProductHistory = async (req, res) => {
    const codigoDeBarras = req.params.codigoDeBarras;
    try {
        // Buscar el producto por su código de barras
        const product = await Product.findOne({ cod_barra: codigoDeBarras });
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        // Obtener el historial del producto
        const history = await ProductHistory.find({ productId: product._id })
            .sort({ timestamp: -1 });

        // Renderizar la vista con los datos del historial y del producto
        res.render('productHistory', { product, history });
    } catch (error) {
        console.error('Error al obtener el historial del producto:', error);
        res.status(500).json({ message: 'Error al obtener el historial del producto' });
    }
};