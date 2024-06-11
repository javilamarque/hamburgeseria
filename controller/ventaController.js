const Product = require('../models/product');
const VentaModel = require('../models/venta');
const User = require('../models/user');
const Caja = require('../models/caja');
const moment = require('moment');
const Combo = require('../models/combo');

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

exports.renderSaleViews = async (req, res) => {
    try {
        const ventas = await VentaModel.find({});
        moment.locale('es');
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

exports.createSale = async (req, res) => {
    const { vendedor, pago, items } = req.body;
    const ventaTotal = parseFloat(req.body.total);

    try {
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Datos de venta no válidos' });
        }

        const processedItems = items.map(item => ({
            cod_barra: item.cod_barra,
            descripcion: item.descripcion,
            cantidad: parseFloat(item.cantidad),
            precio: parseFloat(item.precio),
            total: parseFloat(item.total)
        }));

        if (processedItems.some(item => isNaN(item.cantidad) || isNaN(item.precio) || isNaN(item.total))) {
            return res.status(400).json({ message: 'Datos de venta no válidos' });
        }

        const nuevaVenta = new VentaModel({
            descripcion: processedItems.map(item => item.descripcion).join(', '),
            total: ventaTotal,
            f_factura: new Date(),
            vendedor,
            tipo_pago: pago,
            cantidad: processedItems.reduce((acc, item) => acc + item.cantidad, 0),
            procesada: false // Inicialmente no procesada
        });

        await nuevaVenta.save();

        for (let item of processedItems) {
            if (item.cod_barra.startsWith('combo_')) {
                const comboCodigoBarra = item.cod_barra.split('_')[1];
                const combo = await Combo.findOne({ codigoBarra: comboCodigoBarra }).populate('productos');

                if (!combo) {
                    return res.status(404).json({ message: `Combo con ID ${comboCodigoBarra} no encontrado` });
                }

                for (let product of combo.productos) {
                    const productInDb = await Product.findOne({ cod_barra: product.cod_barra });

                    if (!productInDb) {
                        return res.status(404).json({ message: `Producto con código ${product.cod_barra} no encontrado` });
                    }

                    productInDb.stock -= item.cantidad;
                    await productInDb.save();
                }
            } else {
                const product = await Product.findOne({ cod_barra: item.cod_barra });

                if (!product) {
                    return res.status(404).json({ message: `Producto con código ${item.cod_barra} no encontrado` });
                }

                product.stock -= item.cantidad;
                await product.save();
            }
        }

        // Actualizar la caja solo si la venta no ha sido procesada
        const caja = await Caja.findOne().sort({ fecha_apertura: -1 }).exec();

        if (!caja) {
            return res.status(500).send(`
                <script>
                    alert('No se Encontro una Caja Abierta');
                    window.location.href = '/sales';
                </script>
            `);
        }

        if (!nuevaVenta.procesada) {
            if (pago === 'Mercado Pago') {
                caja.t_transferencia += ventaTotal;
            } else if (pago === 'Efectivo') {
                caja.total_ventas_dia += ventaTotal;
            }

            caja.total_final = caja.apertura + caja.total_ventas_dia - caja.cierre_parcial;
            await caja.save();

            // Marcar la venta como procesada
            nuevaVenta.procesada = true;
            await nuevaVenta.save();
        }

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

exports.addItemToInvoice = async (req, res) => {
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

exports.modifyQuantity = async (req, res) => {
    req.session.invoiceItems = req.session.invoiceItems || [];
    const { cod_barra, nuevaCantidad } = req.body;

    if (!cod_barra || !nuevaCantidad) {
        return res.status(400).json({ message: 'Datos inválidos. cod_barra y nuevaCantidad son requeridos.' });
    }

    try {
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

exports.deleteItemFromInvoice = async (req, res) => {
    const { cod_barra } = req.body;

    try {
        if (!req.session.invoiceItems) {
            return res.status(400).json({ message: 'No hay artículos en la factura' });
        }

        const itemIndex = req.session.invoiceItems.findIndex(item => item.cod_barra === cod_barra);

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Producto no encontrado en la factura' });
        }

        req.session.invoiceItems.splice(itemIndex, 1);

        res.status(200).json({ message: 'Artículo eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el artículo de la factura' });
    }
};

exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        console.error('Error al obtener los usuarios:', error);
        res.status(500).json({ message: 'Error al obtener los usuarios' });
    }
};