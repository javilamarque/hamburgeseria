const mongoose = require('mongoose');
const Combo = require('../models/combo');
const Product = require('../models/product');
// Crear un nuevo combo
// Crear un nuevo combo
exports.createCombo = async (req, res) => {
    try {
        const { nombre, codigoBarra, precio, productos } = req.body;

        if (!nombre || !codigoBarra || !precio || !productos || productos.length === 0) {
            return res.status(400).json({ message: 'Todos los campos son requeridos' });
        }

        const productIds = [];
        for (const producto of productos) {
            const foundProduct = await Product.findOne({ cod_barra: producto.codigoBarra });
            if (foundProduct) {
                productIds.push(foundProduct._id);
            } else {
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

// Actualizar un combo
exports.updateCombo = async (req, res) => {
    try {
        const { nombre, codigoBarra, precio, productos } = req.body;

        if (!nombre || !codigoBarra || !precio || !productos || productos.length === 0) {
            return res.status(400).json({ message: 'Todos los campos son requeridos' });
        }

        const productIds = [];
        for (const producto of productos) {
            const foundProduct = await Product.findOne({ cod_barra: producto.codigoBarra });
            if (foundProduct) {
                productIds.push(foundProduct._id);
            } else {
                return res.status(400).json({ message: `Producto con código de barras ${producto.codigoBarra} no encontrado` });
            }
        }

        const combo = await Combo.findByIdAndUpdate(
            req.params.id,
            { nombre, codigoBarra, precio, productos: productIds },
            { new: true }
        );

        if (!combo) {
            return res.status(404).json({ message: 'Combo no encontrado' });
        }

        res.json({ message: 'Combo actualizado exitosamente', combo });
    } catch (error) {
        console.error('Error al actualizar el combo:', error);
        res.status(500).send('Error al actualizar el combo');
    }
};


// Eliminar un combo
exports.deleteCombo = async (req, res) => {
    try {
        const { id } = req.params;
        await Combo.findByIdAndDelete(id);
        res.status(200).json({ message: 'Combo eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar el combo:', error);
        res.status(500).send('Error al eliminar el combo');
    }
};


// Obtener un combo por su ID
exports.getComboById = async (req, res) => {
    try {
        const combo = await Combo.findById(req.params.id).populate('productos', 'descripcion cod_barra');
        if (!combo) {
            return res.status(404).json({ message: 'Combo no encontrado' });
        }
        res.json(combo);
    } catch (error) {
        console.error('Error al obtener los detalles del combo:', error);
        res.status(500).json({ message: 'Error al obtener los detalles del combo' });
    }
};

// Obtener todos los combos con productos poblados
exports.getAllCombos = async (req, res) => {
    try {
        const combos = await Combo.find().populate('productos', 'descripcion');
        const formattedCombos = combos.map(combo => ({
            _id: combo._id,
            nombre: combo.nombre,
            productos: combo.productos,
            precio: combo.precio,
            codigoBarra: combo.codigoBarra
        }));
        res.json(formattedCombos);
    } catch (error) {
        console.error('Error al obtener los combos:', error);
        res.status(500).send('Error al obtener los combos');
    }
};



// Controlador para obtener todos los productos
exports.getAllProducts = async (req, res) => { // Actualizado
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};