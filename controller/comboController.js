const mongoose = require('mongoose');
const Combo = require('../models/combo');
const Product = require('../models/product');
// Crear un nuevo combo
exports.createCombo = async (req, res) => {
    try {
        const { nombre, codigoBarra, precio, productos } = req.body;

        // Validar que todos los campos estén completos
        if (!nombre || !codigoBarra || !precio || !productos || productos.length === 0) {
            return res.status(400).json({ message: 'Todos los campos son requeridos' });
        }

        console.log('Productos recibidos:', productos); // Debugging

        // Convertir los productos a ObjectId buscando los productos en la base de datos
        const productIds = [];
        for (const producto of productos) {
            console.log('Buscando producto con código de barras:', producto.codigoBarra); // Debugging
            const foundProduct = await Product.findOne({ cod_barra: producto.codigoBarra }); // Ajustar el campo aquí
            if (foundProduct) {
                productIds.push(foundProduct._id);
            } else {
                console.log(`Producto con código de barras ${producto.codigoBarra} no encontrado`); // Debugging
                return res.status(400).json({ message: `Producto con código de barras ${producto.codigoBarra} no encontrado` });
            }
        }

        const nuevoCombo = new Combo({
            nombre,
            codigoBarra,
            precio,
            productos: productIds
        });

        await nuevoCombo.save();
        res.status(201).json({ message: 'Combo creado exitosamente' });
    } catch (error) {
        console.error('Error al crear el combo:', error);
        res.status(500).send('Error al crear el combo');
    }
};


// Controlador para obtener todos los productos
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};
