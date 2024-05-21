const Product = require('../models/product');
const Venta = require('../models/factura');
const User = require('../models/user');

// Renderiza la página de ventas
exports.renderSalePage = (req, res) => {
    res.render('sale'); // Suponiendo que 'sale' es el nombre de tu archivo hbs para la página de ventas
};

// Crear una venta
exports.createSale = async (req, res) => {
    const { cantidad, codigo, descripcion, precio, total, vendedor, pago } = req.body;
    try {
        const newSale = new Venta({ cantidad, codigo, descripcion, precio, total, vendedor, pago });
        await newSale.save();
        res.status(201).send(`
            <script>
                alert('Venta creada exitosamente');
                window.location.href = '/sales';
            </script>
        `);
    } catch (error) {
        res.status(500).send(`
            <script>
                alert('Error al crear la venta');
                window.location.href = '/newSale';
            </script>
        `);
    }
};


// Buscar producto por código de barras
exports.searchProduct = async (req, res) => {
    const { codigo } = req.body;
    try {
        const product = await Product.findOne({ cod_barra: codigo });
        if (!product) {
            return res.status(404).send(`
                <script>
                    alert('Código de producto inválido');
                    window.location.href = '/newSale';
                </script>
            `);
        }
        res.json(product);
    } catch (error) {
        res.status(500).send(`
            <script>
                alert('Error al buscar el producto');
                window.location.href = '/newSale';
            </script>
        `);
    }
};

// Agrega un producto a la factura
exports.addToInvoice = async (req, res) => {
    const { cod_barra, cantidad } = req.body;

    try {
        // Buscar el producto por el código de barras
        const product = await Product.findOne({ cod_barra });

        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        // Crear un nuevo artículo de factura
        const newItem = {
            cod_barra: product.cod_barra,
            descripcion: product.descripcion,
            precio: product.precio_venta,
            cantidad,
            total: product.precio_venta * cantidad
        };

        // Si la sesión de artículos de la factura no existe, crearla
        if (!req.session.invoiceItems) {
            req.session.invoiceItems = [];
        }

        // Agregar el nuevo artículo a la lista de artículos de la factura en la sesión
        req.session.invoiceItems.push(newItem);

        res.status(200).json({ message: 'Producto agregado a la factura correctamente', item: newItem });
    } catch (error) {
        res.status(500).json({ message: 'Error al agregar el producto a la factura' });
    }
};

// Modifica la cantidad de un producto en la factura
exports.modifyQuantity = async (req, res) => {
    const { cod_barra, nuevaCantidad } = req.body;

    try {
        // Verificar que la sesión de artículos de la factura existe
        if (!req.session.invoiceItems) {
            return res.status(400).json({ message: 'No hay artículos en la factura' });
        }

        // Encontrar el artículo en la factura
        const itemIndex = req.session.invoiceItems.findIndex(item => item.cod_barra === cod_barra);

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Producto no encontrado en la factura' });
        }

        // Modificar la cantidad del artículo
        req.session.invoiceItems[itemIndex].cantidad = nuevaCantidad;
        req.session.invoiceItems[itemIndex].total = req.session.invoiceItems[itemIndex].precio * nuevaCantidad;

        res.status(200).json({ message: 'Cantidad modificada correctamente', item: req.session.invoiceItems[itemIndex] });
    } catch (error) {
        res.status(500).json({ message: 'Error al modificar la cantidad del producto en la factura' });
    }
};

// Elimina un artículo de la factura
exports.deleteItemFromInvoice = async (req, res) => {
    const { cod_barra } = req.body;

    try {
        // Verificar que la sesión de artículos de la factura existe
        if (!req.session.invoiceItems) {
            return res.status(400).json({ message: 'No hay artículos en la factura' });
        }

        // Encontrar el artículo en la factura
        const itemIndex = req.session.invoiceItems.findIndex(item => item.cod_barra === cod_barra);

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Producto no encontrado en la factura' });
        }

        // Eliminar el artículo de la factura
        req.session.invoiceItems.splice(itemIndex, 1);

        res.status(200).json({ message: 'Artículo eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el artículo de la factura' });
    }
};

// Función para buscar un producto por descripción
exports.searchProduct = async (req, res) => {
    const { descripcion } = req.body;

    try {
        // Buscar productos que coincidan con la descripción (uso de expresión regular para coincidencia parcial)
        const products = await Product.find({ descripcion: { $regex: descripcion, $options: 'i' } });

        if (!products || products.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error al buscar el producto' });
    }
};

// Renderiza la página de ventas y pasa la lista de usuarios
exports.renderSalePage = async (req, res) => {
    try {
        const users = await User.find();
        res.render('sale', { users });
    } catch (error) {
        res.status(500).send('Error al cargar la página de ventas');
    }
};

// Obtener lista de usuarios
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los usuarios' });
    }
};