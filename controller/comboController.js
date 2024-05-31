const Product = require('../models/product'); // Asegúrate de que el path sea correcto

// Renderizar la página de creación de combos
exports.renderCreateComboPage = (req, res) => {
    res.render('createCombo'); // Asegúrate de que el nombre del archivo de la vista sea correcto
};

// Obtener la lista de productos
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find(); // Asumiendo que estás usando Mongoose
        res.json(products);
    } catch (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).send('Error al obtener los productos');
    }
};