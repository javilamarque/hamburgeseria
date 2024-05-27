const Product = require('../models/product');
const VentaModel = require('../models/venta');
const User = require('../models/user');
const Caja = require('../models/caja');


exports.abrirModal = async (req, res) => {
    try {
        const products = await Product.find();
        res.render('productModal', { products });
    } catch (error) {
        console.error('Error al cargar los productos:', error);
        res.status(500).send('Error al cargar los productos');
    }
};

exports.seleccionarProducto = async (req, res) => {
    const { cod_barra, descripcion, precio } = req.body;
    req.session.invoiceItems = req.session.invoiceItems || [];
    try {
        const existingItem = req.session.invoiceItems.find(item => item.cod_barra === cod_barra);
        if (existingItem) {
            existingItem.cantidad += 1;
            existingItem.total = existingItem.cantidad * parseFloat(precio);
        } else {
            req.session.invoiceItems.push({
                cod_barra,
                descripcion,
                precio: parseFloat(precio),
                cantidad: 1,
                total: parseFloat(precio)
            });
        }
        req.session.save();
        res.redirect('/sales');
    } catch (error) {
        console.error('Error al seleccionar el producto:', error);
        res.status(500).send('Error al seleccionar el producto');
    }
};



// ------------------------------------------------------------------------------------------------------Renderiza la página de ventas
exports.renderSalePage = async (req, res) => {
    try {
        const users = await User.find();
        const lastSale = await VentaModel.findOne().sort({ fac_num: -1 }).exec();
        const nextFactura = lastSale ? lastSale.fac_num + 1 : 1;

        res.render('sales', { users, nextFactura });
    } catch (error) {
        console.error('Error al cargar la página de ventas:', error);
        res.status(500).send('Error al cargar la página de ventas');
    }
};

// ----------------------------------------------------------------------------------------------------------Crear una venta
exports.createSale = async (req, res) => {
    try {
        const { factura, cantidad, codigo, descripcion, precio, total, vendedor, pago, fecha } = req.body;

        const facturas = Array.isArray(factura) ? factura : [factura];
        const cantidades = Array.isArray(cantidad) ? cantidad : [cantidad];
        const codigos = Array.isArray(codigo) ? codigo : [codigo];
        const descripciones = Array.isArray(descripcion) ? descripcion : [descripcion];
        const precios = Array.isArray(precio) ? precio : [precio];
        const totales = Array.isArray(total) ? total : [total];
        const fechas = Array.isArray(fecha) ? fecha : [fecha];
        const vendedores = Array.isArray(vendedor) ? vendedor : [vendedor];
        const pagos = Array.isArray(pago) ? pago : [pago];

        const ventasArray = cantidades.map((cant, index) => ({
            factura: facturas[index],
            cantidad: cant,
            codigo: codigos[index],
            descripcion: descripciones[index],
            precio: precios[index],
            total: totales[index],
            pago: pagos[index],
            fecha: fechas[index],
            vendedor: vendedores[index]
        }));

        // Crear las ventas en la base de datos
        const ventas = await VentaModel.create(ventasArray);

        // Actualizar los valores de la caja
        const caja = await Caja.findOne().sort({ fecha_apertura: -1 }).exec();

        ventasArray.forEach(venta => {
            if (venta.pago === 'Mercado Pago') {
                caja.t_transferencia += venta.total;
            } else if (venta.pago === 'Efectivo') {
                caja.total_ventas_dia += venta.total;
            }
        });

        caja.total_final = caja.apertura + caja.total_ventas_dia - caja.cierre_parcial;
        await caja.save();

        res.send(
            `<script>
                alert('Venta creada exitosamente');
                window.location.href = '/sales';
            </script>`
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear la venta' });
    }
};



// ------------------------------------------------------------------------------------------Buscar producto por código de barras
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

// ---------------------------------------------------------------------------------------------------Agrega un producto a la factura
exports.addItemToInvoice = async (req, res) => {
    const { cod_barra, descripcion, precio } = req.body;
    req.session.invoiceItems = req.session.invoiceItems || [];
    try {
        // Inicializa la sesión si no está definida


        const existingItem = req.session.invoiceItems.find(item => item.cod_barra === cod_barra);

        if (existingItem) {
            existingItem.cantidad += 1;
            existingItem.total = existingItem.cantidad * parseFloat(precio);
        } else {
            req.session.invoiceItems.push({
                cod_barra,
                descripcion,
                precio: parseFloat(precio),
                cantidad: 1,
                total: parseFloat(precio)
            });
        }

        // Guarda la sesión después de modificarla
        req.session.save((err) => {
            if (err) {
                return res.status(500).json({ message: 'Error al guardar la sesión' });
            }
            res.status(200).json({ message: 'Artículo agregado a la factura', invoiceItems: req.session.invoiceItems });
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al agregar el artículo a la factura' });
    }
};

//--------------------------------------------------------------------------- Modifica la cantidad de un producto en la factura
// Modifica la cantidad de un producto en la factura
exports.modifyQuantity = async (req, res) => {
    req.session.invoiceItems = req.session.invoiceItems || [];
    const { cod_barra, nuevaCantidad } = req.body;

    // Log para verificar los datos recibidos
    console.log('Datos recibidos:', { cod_barra, nuevaCantidad });
    console.log('Artículos en la factura antes de la modificación:', req.session.invoiceItems);

    if (!cod_barra || !nuevaCantidad) {
        return res.status(400).json({ message: 'Datos inválidos. cod_barra y nuevaCantidad son requeridos.' });
    }

    try {
        // Inicializa la sesión si no está definida
        req.session.invoiceItems = req.session.invoiceItems || [];
        console.log('Artículos en la factura antes de la modificación:', req.session.invoiceItems);
        if (!req.session.invoiceItems || req.session.invoiceItems.length === 0) {
            console.log('No hay artículos en la factura');
            return res.status(204).json({ message: 'No hay artículos en la factura' });
        }

        const item = req.session.invoiceItems.find(item => item.cod_barra === cod_barra);

        if (!item) {
            console.log('Producto no encontrado en la factura');
            return res.status(404).json({ message: 'Producto no encontrado en la factura' });
        }

        console.log('Producto encontrado:', item);

        const precio = parseFloat(item.precio);
        const cantidad = parseFloat(nuevaCantidad);

        if (isNaN(precio) || isNaN(cantidad)) {
            console.log('Datos inválidos para el cálculo', { precio, cantidad });
            return res.status(400).json({ message: 'Datos inválidos para el cálculo' });
        }

        item.cantidad = cantidad;
        item.total = precio * cantidad;

        // Guardar la sesión después de modificarla
        req.session.save((err) => {
            if (err) {
                console.log('Error al guardar la sesión', err);
                return res.status(500).json({ message: 'Error al guardar la sesión' });
            }
            console.log('Cantidad modificada correctamente', { item, precio: item.precio });
            res.status(200).json({ message: 'Cantidad modificada correctamente', item, precio: item.precio });
        });
    } catch (error) {
        console.log('Error al modificar la cantidad del producto en la factura', error);
        res.status(500).json({ message: 'Error al modificar la cantidad del producto en la factura' });
    }
};

// ---------------------------------------------------------------------------------------------------Elimina un artículo de la factura
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

// ----------------------------------------------------------------------------------------------------------Obtener lista de productos
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};



// ---------------------------------------------------------------------------------------------------------Obtener lista de usuarios
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find();
        console.log('Usuarios encontrados:', users); // Agregar este registro de depuración
        res.json(users);
    } catch (error) {
        console.error('Error al obtener los usuarios:', error); // Agregar este registro de depuración
        res.status(500).json({ message: 'Error al obtener los usuarios' });
    }
};