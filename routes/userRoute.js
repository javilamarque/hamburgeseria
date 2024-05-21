const express = require('express');
const User = require('../models/user.js');
const UserController = require('../controller/userController');
const router = express.Router();

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.send(`
                <script>
                    alert('Usuario no encontrado');
                    window.location.href = '/login';
                </script>
            `);
        }

        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.send(`
                <script>
                    alert('Contraseña incorrecta');
                    window.location.href = '/login';
                </script>
            `);
        }

        // Determine user role based on username
        let userRole = 'empleado';
        if (username === 'javi') {
            userRole = 'admin';
        }

        // Redirect to different pages based on user role
        if (userRole === 'admin') {
            return res.redirect('/admin');
        } else {
            return res.redirect('/empleado');
        }
    } catch (error) {
        console.error('Error al autenticar al usuario:', error);
        return res.send(`
            <script>
                alert('Error en el servidor');
                window.location.href = '/login';
            </script>
        `);
    }
});


// Ruta para ver usuarios registrados
router.get('/users', UserController.getAllUsers);

// Ruta para mostrar el formulario de registro de usuarios
router.get('/register', UserController.getRegisterPage);

// Ruta para registrar un nuevo usuario
router.post('/register', UserController.registerUser);

router.get('/users', UserController.getAllUsers);

router.delete('/users/:id', UserController.deleteUserById)


module.exports = router;