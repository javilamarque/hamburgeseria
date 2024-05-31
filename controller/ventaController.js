const Product = require('../models/product');
const VentaModel = require('../models/venta');
const User = require('../models/user');
const Caja = require('../models/caja');
const moment = require('moment');




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



// ------------------------------------------------------------------------------------------------------RENDERIZAR LA PAGINA DE VENTAS------------------------------------------------------------------------
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



//-------------------------------------------------------------------------------------------------------MOSTRAR VENTAS REALIZADAS
exports.renderSaleViews = async (req, res) => {
    try {
        const ventas = await VentaModel.find({});
        moment.locale('es')
        // Formatear las fechas
        const ventasFormatted = ventas.map(venta => ({
            ...venta._doc,
            f_factura: moment(venta.f_factura).format('dddd, D MMMM YYYY, HH:mm:ss')
        }));

        res.render('viewSales', { ventas: ventasFormatted });
    } catch (error) {
        console.error('Error al obtener las ventas:', error);
        res.status(500).send('Error al obtener las ventas.');
    }
};

// ----------------------------------------------------------------------------------------------------------CREAR VENTAS----------------------------------------------------------------------------------------
exports.createSale = async (req, res) => {

    // Verificar si la caja está abierta
    const caja = await Caja.findOne().sort({ fecha_apertura: -1 }).exec();
    if (!caja || caja.cierre_parcial) {
        return res.status(400).send(`
            <script>
                alert('No se Puede Realizar la Venta, debe Haber una caja abierta previamente');
                window.location.href = '/sales';
            </script>
        `);
    }

    try {
        const { items, total, vendedor, pago } = req.body;
        if (!items || Object.keys(items).length === 0) {
            throw new Error('La lista de items no es válida.');
        }

        const processedItems = await Promise.all(Object.values(items).map(async (item, index) => {

            const cod_barra = parseInt(item.cod_barra);
            const cantidad = parseInt(item.cantidad);
            const precio = parseFloat(item.precio);
            const total = parseFloat(item.total);

            

            if (isNaN(cod_barra) || isNaN(cantidad) || isNaN(precio) || isNaN(total)) {
                throw new Error('Datos de item no válidos');
            }

            if (!cod_barra) {
                throw new Error(`El código de barra del item ${index + 1} es inválido.`);
            }

            const product = await Product.findOne({ cod_barra });
            if (!product) {
                throw new Error(`Producto con código ${cod_barra} no encontrado`);
            }

            return {
                cod_barra,
                descripcion: product.descripcion,
                cantidad,
                precio,
                total
            };
        }));

        const ventaTotal = parseFloat(total);
        if (isNaN(ventaTotal) || typeof vendedor !== 'string' || !['Efectivo', 'Mercado Pago'].includes(pago)) {
            throw new Error('Datos de venta no válidos');
        }

        const nuevaVenta = new VentaModel({
            descripcion: processedItems.map(item => item.descripcion).join(', '),
            total: ventaTotal,
            f_factura: new Date(),
            vendedor,
            tipo_pago: pago,
            cantidad: processedItems.reduce((acc, item) => acc + item.cantidad, 0)
        });

        await nuevaVenta.save();

        for (let item of processedItems) {
            const product = await Product.findOne({ cod_barra: item.cod_barra });

            if (!product) {
                return res.status(404).json({ message: `Producto con código ${item.cod_barra} no encontrado` });
            }

            product.stock -= item.cantidad;
            await product.save();
        }

        const caja = await Caja.findOne().sort({ fecha_apertura: -1 }).exec();

        if (!caja) {
            return res.status(500).send(`
                <script>
                    alert('No se Encontro una Caja Abierta');
                    window.location.href = '/sales';
                </script>
            `);
        }

        if (pago === 'Mercado Pago') {
            caja.t_transferencia += ventaTotal;
        } else if (pago === 'Efectivo') {
            caja.total_ventas_dia += ventaTotal;
        }

        caja.total_final = caja.apertura + caja.total_ventas_dia - caja.cierre_parcial;
        await caja.save();

        res.send(
            `<script>
                alert('Venta creada exitosamente');
                window.location.href = '/sales';
            </script>`
        );
    } catch (error) {
        console.error('Error al crear la venta:', error);
        res.status(500).json({ message: 'Error al crear la venta' });
    }
};




// -----------------------------------------------------------------------------------------------------BUSCAR PRODUCTOS-------------------------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------------------------------AGREGAR PRODUCTO A LA FACTURA==================================================================================
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

//---------------------------------------------------------------------------========================MODIFICAR CANTIDAD EN LA FACTURA================================================================================
// Modifica la cantidad de un producto en la factura
exports.modifyQuantity = async (req, res) => {
    req.session.invoiceItems = req.session.invoiceItems || [];
    const { cod_barra, nuevaCantidad } = req.body;


    if (!cod_barra || !nuevaCantidad) {
        return res.status(400).json({ message: 'Datos inválidos. cod_barra y nuevaCantidad son requeridos.' });
    }

    try {
        // Inicializa la sesión si no está definida
        req.session.invoiceItems = req.session.invoiceItems || [];

        if (!req.session.invoiceItems || req.session.invoiceItems.length === 0) {
            return res.status(204).json({ message: 'No hay artículos en la factura' });
        }

        const item = req.session.invoiceItems.find(item => item.cod_barra === cod_barra);

        if (!item) {
            return res.status(404).json({ message: 'Producto no encontrado en la factura' });
        }


        const precio = parseFloat(item.precio);
        const cantidad = parseFloat(nuevaCantidad);

        if (isNaN(precio) || isNaN(cantidad)) {
            return res.status(400).json({ message: 'Datos inválidos para el cálculo' });
        }

        item.cantidad = cantidad;
        item.total = precio * cantidad;

        // Guardar la sesión después de modificarla
        req.session.save((err) => {
            if (err) {
                return res.status(500).json({ message: 'Error al guardar la sesión' });
            }
            res.status(200).json({ message: 'Cantidad modificada correctamente', item, precio: item.precio });
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al modificar la cantidad del producto en la factura' });
    }
};

// ---------------------------------------------------------------------------------------------------ELIMINAR ARTICULO DE LA FACTURA===============================================================================
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

// ----------------------------------------------------------------------------------------------------------OBTENER LISTA DE PRODUCTOS==============================================================================
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};



// ---------------------------------------------------------------------------------------------------------OBTENER LISTA DE USUARIOS===================================================================================
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        console.error('Error al obtener los usuarios:', error); // Agregar este registro de depuración
        res.status(500).json({ message: 'Error al obtener los usuarios' });
    }
};