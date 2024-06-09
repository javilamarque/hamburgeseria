const User = require('../models/user');
const bcrypt = require('bcrypt')

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
    const { username, password, role } = req.body;

    // Validar que se ha seleccionado exactamente una casilla de verificación
    if (!role) {
        return res.send(`
            <script>
                alert('Debe seleccionar un rol');
                window.history.back();
            </script>
        `);
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword, role });
        await newUser.save();
        res.send(
            `<script>
                alert('Usuario creado exitosamente');
                window.location.href = '/users';
            </script>`
        );
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).send(
            `<script>
                alert('Error al registrar usuario');
                window.history.back();
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
        res.status(200).end();
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el usuario' });
    }
};

exports.loginUser = async (req, res) => {
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

        // Almacenar rol de usuario en sesión
        req.session.userRole = user.role;

        // Redirigir según rol del usuario
        if (user.role === 'admin') {
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
};

exports.getEditUserPage = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.render('editUser', { user });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el usuario' });
    }
};

exports.editUserById = async (req, res) => {
    const { username, password, role } = req.body;
    const userId = req.params.id;

    if (!role) {
        return res.send(`
            <script>
                alert('Debe seleccionar un rol');
                window.history.back();
            </script>
        `);
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const updatedUser = await User.findByIdAndUpdate(userId, { username, password: hashedPassword, role }, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        return res.send(`
            <script>
                alert('Usuario actualizado exitosamente');
                window.location.href = '/users';
            </script>
        `);


    } catch (error) {
        console.error('Error al actualizar el usuario:', error);
        res.status(500).send(
            `< script >
            alert('Error al actualizar usuario');
        window.history.back();
            </script >`
        );
    }
};
