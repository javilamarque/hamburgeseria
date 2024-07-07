const Product = require('../models/product');
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
        if (product.stock === 0) {
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
        // Verificar si el código de barras ya existe
        const existingProduct = await Product.findOne({ cod_barra });
        if (existingProduct) {
            return res.send(`
                <script>
                    alert('Ya Existe este codigo de Barras!!!');
                    window.location.href = '/products';
                </script>
            `);
        }

        const newProduct = new Product({ cod_barra, descripcion, stock, costo, precio_venta, fecha });
        await newProduct.save();

        // Mostrar un alert y redirigir a la página de productos
        res.send(`
            <script>
                alert('Producto creado exitosamente');
                window.location.href = '/products';
            </script>
        `);
    } catch (error) {
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
        // Encuentra el producto original por su código de barras actual
        const updatedProduct = await Product.findOneAndUpdate({ cod_barra: codigoDeBarras }, updateData, { new: true });

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Producto no encontrado para actualizar' });
        }

        res.json(updatedProduct); // Devuelve el producto actualizado como respuesta
    } catch (error) {
        console.error('Error al actualizar el producto:', error);
        res.status(500).json({ message: 'Error al actualizar el producto' });
    }
};


exports.deleteProductByBarcode = async (req, res) => {
    const codigoDeBarras = req.params.codigoDeBarras;
    try {
        const deletedProduct = await Product.findOneAndDelete({ cod_barra: codigoDeBarras });
        if (!deletedProduct) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.status(200).end(); // Enviar una respuesta 200 sin contenido
    } catch (error) {
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