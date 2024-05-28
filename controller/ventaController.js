const Product = require('../models/product');
const VentaModel = require('../models/venta');
const User = require('../models/user');
const Caja = require('../models/caja');
const moment = require('moment');


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

// ----------------------------------------------------------------------------------------------------------Crear una venta
exports.createSale = async (req, res) => {
    try {
        const { factura, cantidad, codigo, descripcion, precio, total, vendedor, pago, fecha } = req.body;

        // Asegurarse de que los datos estén en arrays
        const facturas = Array.isArray(factura) ? factura : [factura];
        const cantidades = Array.isArray(cantidad) ? cantidad : [cantidad];
        const codigos = Array.isArray(codigo) ? codigo : [codigo];
        const descripciones = Array.isArray(descripcion) ? descripcion : [descripcion];
        const precios = Array.isArray(precio) ? precio : [precio];
        const totales = Array.isArray(total) ? total : [total];
        const fechas = Array.isArray(fecha) ? fecha : [fecha];
        const vendedores = Array.isArray(vendedor) ? vendedor : [vendedor];
        const pagos = Array.isArray(pago) ? pago : [pago];

        // Crear ventas individuales
        const ventasArray = [];
        for (let i = 0; i < codigos.length; i++) {
            const codigosBarra = codigos[i].split(',').map(codigo => codigo.trim());
            const descripcionesArray = descripciones[i].split(',').map(desc => desc.trim());
            const preciosArray = precios[i].split(',').map(precio => parseFloat(precio.trim()));
            const totalesArray = totales[i].split(',').map(total => parseFloat(total.trim()));
            const tipoPago = pagos[i]; // Obtener el tipo de pago de acuerdo al índice de la venta

            for (let j = 0; j < codigosBarra.length; j++) {
                ventasArray.push({
                    num_factura: facturas[0], // Asumiendo que la factura es la misma para todos los artículos
                    cantidad: parseFloat(cantidades[i].split(',')[j]),
                    codigo: codigosBarra[j],
                    descripcion: descripcionesArray[j],
                    precio: preciosArray[j],
                    total: totalesArray[j],
                    tipo_pago: tipoPago, // Asignar el tipo de pago correspondiente
                    fecha: new Date(fechas[0]), // Asumiendo que la fecha es la misma para todos los artículos
                    vendedor: vendedores[0] // Asumiendo que el vendedor es el mismo para todos los artículos
                });
            }
        }


        // Crear las ventas en la base de datos
        await VentaModel.create(ventasArray);

        // Buscar y actualizar el stock de los productos
        for (let venta of ventasArray) {
            const product = await Product.findOne({ cod_barra: venta.codigo });

            if (!product) {
                return res.status(404).json({ message: `Producto con código ${venta.codigo} no encontrado` });
            }

            // Descontar la cantidad vendida del stock
            product.stock -= venta.cantidad;

            // Guardar los cambios en el producto
            await product.save();
        }

        const caja = await Caja.findOne().sort({ fecha_apertura: -1 }).exec();

        if (!caja) {
            return res.status(500).json({ message: 'No se encontró una caja abierta.' });
        }

        ventasArray.forEach(venta => {
            if (venta.tipo_pago === 'Mercado Pago') {
                caja.t_transferencia += venta.total; // Sumar a t_transferencia en lugar de total_ventas_dia
            } else if (venta.tipo_pago === 'Efectivo') {
                caja.total_ventas_dia += venta.total;
            }
        });

        // Calcular el total final de la caja
        caja.total_final = caja.apertura + caja.total_ventas_dia - caja.cierre_parcial;

        // Guardar los cambios en la caja
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
        res.json(users);
    } catch (error) {
        console.error('Error al obtener los usuarios:', error); // Agregar este registro de depuración
        res.status(500).json({ message: 'Error al obtener los usuarios' });
    }
};