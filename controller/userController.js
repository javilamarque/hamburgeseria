const User = require('../models/user');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.render('users', { users });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
};

exports.getRegisterPage = (req, res) => {
    res.render('register');
};

exports.registerUser = async (req, res) => {
    const { username, password } = req.body;
    try {
        const newUser = new User({ username, password });
        await newUser.save();
        res.send(
            `<script>
                alert('Usuario creado exitosamente');
                window.location.href = '/users';
            </script>`
        );
    } catch (error) {
        res.status(500).send(
            `<script>
                alert('Error al registrar usuario');
                window.location.href = '/register';
            </script>`
        );
    }
};

exports.deleteUserById = async (req, res) => {
    const userId = req.params.id;
    try {
        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.status(200).end(); // Enviar una respuesta 200 sin contenido
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el usuario' });
    }
};


