const Product = require('../models/product');
const VentaModel = require('../models/venta');
const User = require('../models/user');
const Caja = require('../models/caja');
const moment = require('moment');
const Combo = require('../models/combo');
const HistorialReporte = require('../models/historialReporte');
const ExcelJS = require('exceljs');

const formatMoney = (amount) => {
    return `$${amount.toFixed(2)}`; // Ajusta a 2 decimales y agrega "$"
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

exports.createSale = async (req, res) => {
    const { vendedor, pago, items } = req.body;
    const ventaTotal = parseFloat(req.body.total.replace('$', ''));

    try {
        if (!items || items.length === 0) {
            console.error('No se recibieron ítems');
            return res.status(400).json({ message: 'Datos de venta no válidos' });
        }

        const processedItems = items.map(item => ({
            cod_barra: item.cod_barra.toString(),
            descripcion: item.descripcion,
            cantidad: parseFloat(item.cantidad),
            precio: parseFloat(item.precio.replace('$', '')),
            total: parseFloat(item.total.replace('$', ''))
        }));

        if (processedItems.some(item => isNaN(item.cantidad) || isNaN(item.precio) || isNaN(item.total))) {
            console.error('Datos de ítems inválidos:', processedItems);
            return res.status(400).json({ message: 'Datos de venta no válidos' });
        }

        const nuevaVenta = new VentaModel({
            descripcion: processedItems.map(item => item.descripcion).join(', '),
            total: ventaTotal,
            f_factura: new Date(),
            vendedor,
            tipo_pago: pago,
            cantidad: processedItems.reduce((acc, item) => acc + item.cantidad, 0),
            procesada: false, // Inicialmente no procesada
            items: processedItems // Aquí agregamos los items
        });

        await nuevaVenta.save();

        for (let item of processedItems) {
            if (item.cod_barra.startsWith('combo_')) {
                const comboCodigoBarra = item.cod_barra.split('_')[1];
                const combo = await Combo.findOne({ codigoBarra: comboCodigoBarra }).populate('productos');

                if (!combo) {
                    console.error(`Combo con ID ${comboCodigoBarra} no encontrado`);
                    return res.status(404).json({ message: `Combo con ID ${comboCodigoBarra} no encontrado` });
                }

                for (let product of combo.productos) {
                    const productInDb = await Product.findOne({ cod_barra: product.cod_barra });

                    if (!productInDb) {
                        console.error(`Producto con código ${product.cod_barra} no encontrado`);
                        return res.status(404).json({ message: `Producto con código ${product.cod_barra} no encontrado` });
                    }

                    productInDb.stock -= item.cantidad;
                    await productInDb.save();
                }
            } else {
                const product = await Product.findOne({ cod_barra: item.cod_barra });

                if (!product) {
                    console.error(`Producto con código ${item.cod_barra} no encontrado`);
                    return res.status(404).json({ message: `Producto con código ${item.cod_barra} no encontrado` });
                }

                product.stock -= item.cantidad;
                await product.save();
            }
        }

        // Actualizar la caja solo si la venta no ha sido procesada
        const caja = await Caja.findOne().sort({ fecha_apertura: -1 }).exec();

        if (!caja) {
            console.error('No se encontró una caja abierta');
            return res.status(500).send(`
                <script>
                    alert('No se encontró una caja abierta');
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

//ANULAR VENTAS
exports.anularVenta = async (req, res) => {
    const { fac_num } = req.body;

    try {
        if (!fac_num) {
            return res.status(400).json({ message: 'Número de factura no válido' });
        }

        const venta = await VentaModel.findOne({ fac_num });


        if (!venta) {
            return res.status(404).json({ message: 'Venta no encontrada' });
        }

        // Calcular el tiempo transcurrido en horas desde la creación de la venta
        const horasTranscurridas = Math.abs(new Date() - venta.createdAt) / 36e5;

        if (horasTranscurridas > 24) {
            return res.status(403).json({ message: 'No se puede anular la venta después de 24 horas' });
        }

        // Obtener los productos vendidos de la descripción
        const descripcionProductos = venta.descripcion.split(',').map(item => item.trim());

        // Actualizar el stock del producto
        for (const descripcionProducto of descripcionProductos) {
            const producto = await Product.findOne({ descripcion: descripcionProducto });
            if (producto) {
                // Aquí asumo que el campo `cantidad` de la venta representa la cantidad vendida de ese producto
                producto.stock += venta.cantidad;
                await producto.save();
            }
        }
        // Actualizar la caja
        const cajaAbierta = await Caja.findOne().sort({ fecha_apertura: -1 });

        if (!cajaAbierta) {
            return res.status(500).json({ message: 'No se encontró una caja abierta.' });
        }

        if (venta.tipo_pago === 'Efectivo') {
            if (cajaAbierta.total_ventas_dia - venta.total < 0) {
                return res.send(`
                <script>
                    alert('No se puede anular la venta porque no hay suficiente ventas en el dia');
                    window.location.href = '/viewSales';
                </script>
                `);
            }
            cajaAbierta.total_ventas_dia -= venta.total;
            cajaAbierta.total_final -= venta.total;
        } else if (venta.tipo_pago === 'Transferencia') {
            if (cajaAbierta.total_transferencia - venta.total < 0) {
                return res.send(`
                    <script>
                        alert('No se puede anular la venta porque las transferencias quedarían en negativo');
                        window.location.href = '/viewSales';
                    </script>
                `);
            }
            cajaAbierta.total_transferencia -= venta.total;
            cajaAbierta.total_final -= venta.total;
        }
        await cajaAbierta.save();

        // Eliminar la venta de la base de datos
        await VentaModel.deleteOne({ fac_num });

        res.redirect('/viewSales'); // Redirigir de nuevo a la lista de ventas
    } catch (error) {
        console.error('Error al anular la venta:', error);
        res.status(500).json({ message: 'Error al anular la venta', error });
    }
};

exports.renderSaleViews = async (req, res) => {
    try {
        const ventas = await VentaModel.find({}).sort({ fac_num: -1 });
        moment.locale('es');
        const ventasFormatted = ventas.map(venta => ({
            ...venta._doc,
            total: formatMoney(venta.total), // Formatea el total con "$"
            f_factura: moment(venta.f_factura).format('dddd, D MMMM YYYY, HH:mm:ss')
        }));

        res.render('viewSales', { ventas: ventasFormatted });
    } catch (error) {
        console.error('Error al obtener las ventas:', error);
        res.status(500).send('Error al obtener las ventas.');
    }
};


exports.reportesVentasProductosCombos = async (req, res) => {
    try {
        const ventas = await VentaModel.find({});

        if (!ventas || ventas.length === 0) {
            return res.render('reportes', {
                ventas: [],
                totalGeneral: '0.00'
            });
        }

        const ventasAgrupadas = ventas.reduce(async (accPromise, venta) => {
            const acc = await accPromise;

            if (!venta.items || venta.items.length === 0) return acc;

            for (let item of venta.items) {
                if (!item.cod_barra.startsWith('combo_')) {
                    // Si no es un combo, simplemente usar la descripción del item
                    if (!acc[item.descripcion]) {
                        acc[item.descripcion] = {
                            cantidad: 0,
                            descripcion: item.descripcion,
                            precio: item.precio,
                            total: 0
                        };
                    }
                    acc[item.descripcion].cantidad += item.cantidad;
                    acc[item.descripcion].total += item.total;
                } else {
                    // Si es un combo, buscar el nombre del combo
                    const comboCodigoBarra = item.cod_barra.split('_')[1];
                    const combo = await Combo.findOne({ codigoBarra: comboCodigoBarra }).populate('productos');

                    if (!combo) {
                        console.error(`Combo con ID ${comboCodigoBarra} no encontrado`);
                        continue;
                    }

                    const comboDescripcion = combo.nombre;

                    if (!acc[comboDescripcion]) {
                        acc[comboDescripcion] = {
                            cantidad: 0,
                            descripcion: comboDescripcion,
                            precio: item.precio,
                            total: 0
                        };
                    }
                    acc[comboDescripcion].cantidad += item.cantidad;
                    acc[comboDescripcion].total += item.total;
                }
            }

            return acc;
        }, Promise.resolve({}));

        const ventasAgrupadasFinal = await ventasAgrupadas;
        const ventasArray = Object.values(ventasAgrupadasFinal);
        const totalGeneral = ventasArray.reduce((acc, item) => acc + item.total, 0);



        res.render('reportes', {
            ventas: ventasArray,
            totalGeneral: totalGeneral.toFixed(2)
        });
    } catch (error) {
        console.error('Error al obtener el reporte de ventas:', error);
        res.status(500).send('Error al obtener el reporte de ventas.');
    }
};


exports.exportarExcel = async (req, res) => {
    try {
        const ventas = await VentaModel.find({});

        if (!ventas || ventas.length === 0) {
            return res.status(500).send(`
                <script>
                    alert('No se encontraron reportes para exportar');
                    window.location.href = '/reportes';
                </script>
            `);
        }

        // Agrupar ventas por descripción
        const ventasAgrupadas = await ventas.reduce(async (accPromise, venta) => {
            const acc = await accPromise;

            if (!venta.items || venta.items.length === 0) return acc;

            for (let item of venta.items) {
                if (!item.cod_barra.startsWith('combo_')) {
                    if (!acc[item.descripcion]) {
                        acc[item.descripcion] = {
                            cantidad: 0,
                            descripcion: item.descripcion,
                            precio: item.precio,
                            total: 0
                        };
                    }
                    acc[item.descripcion].cantidad += item.cantidad;
                    acc[item.descripcion].total += item.total;
                } else {
                    const comboCodigoBarra = item.cod_barra.split('_')[1];
                    const combo = await Combo.findOne({ codigoBarra: comboCodigoBarra }).populate('productos');

                    if (!combo) {
                        console.error(`Combo con ID ${comboCodigoBarra} no encontrado`);
                        continue;
                    }

                    const comboDescripcion = combo.nombre;

                    if (!acc[comboDescripcion]) {
                        acc[comboDescripcion] = {
                            cantidad: 0,
                            descripcion: comboDescripcion,
                            precio: item.precio,
                            total: 0
                        };
                    }
                    acc[comboDescripcion].cantidad += item.cantidad;
                    acc[comboDescripcion].total += item.total;
                }
            }

            return acc;
        }, Promise.resolve({}));

        const ventasAgrupadasFinal = await ventasAgrupadas;
        const ventasArray = Object.values(ventasAgrupadasFinal);
        const totalGeneral = ventasArray.reduce((acc, item) => acc + item.total, 0).toFixed(2);

        // Crear un nuevo workbook de Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Reporte de Ventas');

        // Obtener la fecha y hora actual
        const fechaHoraExportacion = new Date().toLocaleString();

        // Agregar título con fecha y hora
        worksheet.addRow([`Datos Exportados ${fechaHoraExportacion}`]);
        worksheet.addRow([]);

        // Definir las columnas en la hoja de cálculo
        worksheet.columns = [
            { header: 'CANT', key: 'cantidad', width: 10 },
            { header: 'DESCRIPCION', key: 'descripcion', width: 40 },
            { header: 'P/UNIT', key: 'precio', width: 15, style: { numFmt: '"$"#,##0.00' } },
            { header: 'TOTAL', key: 'total', width: 15, style: { numFmt: '"$"#,##0.00' } }
        ];

        // Agregar los datos de ventas al worksheet
        ventasArray.forEach(venta => {
            worksheet.addRow({
                cantidad: venta.cantidad,
                descripcion: venta.descripcion,
                precio: parseFloat(venta.precio.toFixed(2)),
                total: parseFloat(venta.total.toFixed(2))
            });
        });

        // Agregar fila para el total general
        worksheet.addRow(['', 'TOTAL GENERAL', '', parseFloat(totalGeneral)]);

        // Definir estilos para encabezados y celdas
        worksheet.getRow(1).eachCell(cell => {
            cell.font = { bold: true };
            cell.alignment = { horizontal: 'center' };
        });

        // Generar un archivo Excel en memoria
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=reporte_ventas.xlsx');

        // Escribir el workbook en el response
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error al exportar a Excel:', error);
        res.status(500).send('Error al exportar a Excel.');
    }
};


exports.cerrarReporte = async (req, res) => {
    try {
        const ventas = await VentaModel.find({});

        if (!ventas || ventas.length === 0) {
            return res.status(500).send(`
                <script>
                    alert('No se encontraron reportes para exportar');
                    window.location.href = '/reportes';
                </script>
            `);
        }

        const ventasAgrupadas = ventas.reduce(async (accPromise, venta) => {
            const acc = await accPromise;

            if (!venta.items || venta.items.length === 0) return acc;

            for (let item of venta.items) {
                if (!item.cod_barra.startsWith('combo_')) {
                    if (!acc[item.descripcion]) {
                        acc[item.descripcion] = {
                            cantidad: 0,
                            descripcion: item.descripcion,
                            precio: item.precio,
                            total: 0
                        };
                    }
                    acc[item.descripcion].cantidad += item.cantidad;
                    acc[item.descripcion].total += item.total;
                } else {
                    const comboCodigoBarra = item.cod_barra.split('_')[1];
                    const combo = await Combo.findOne({ codigoBarra: comboCodigoBarra }).populate('productos');

                    if (!combo) {
                        console.error(`Combo con ID ${comboCodigoBarra} no encontrado`);
                        continue;
                    }

                    const comboDescripcion = combo.nombre;

                    if (!acc[comboDescripcion]) {
                        acc[comboDescripcion] = {
                            cantidad: 0,
                            descripcion: comboDescripcion,
                            precio: item.precio,
                            total: 0
                        };
                    }
                    acc[comboDescripcion].cantidad += item.cantidad;
                    acc[comboDescripcion].total += item.total;
                }
            }

            return acc;
        }, Promise.resolve({}));

        const ventasAgrupadasFinal = await ventasAgrupadas;
        const ventasArray = Object.values(ventasAgrupadasFinal);
        const totalGeneral = ventasArray.reduce((acc, item) => acc + item.total, 0);

        // Crear un nuevo historial de reporte
        const nuevoHistorial = new HistorialReporte({
            ventas: ventasArray,
            totalGeneral: totalGeneral.toFixed(2)
        });

        await nuevoHistorial.save();

        // Eliminar todas las ventas actuales
        await VentaModel.deleteMany({});

        res.redirect('/reportes'); // Redirigir a la página de reportes
    } catch (error) {
        console.error('Error al cerrar el reporte:', error);
        res.status(500).send('Error al cerrar el reporte.');
    }
};
