const User = require('../models/user');

exports.loginUser = async (req, res) => {
    const { username, password } = req.body;
    
    try {
        // Check if user exists in the database
        const user = await User.findOne({ username });
        console.log("Role del usuario:", user.role);

        if (!user) {
            return res.status(404).json({ message: 'Usuario no Valido' });
        }

        // Validate Password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Password Invalido' });
        }


        if (user.role === 'admin') {
            return res.redirect('/admin/home');
        } else {
            return res.redirect('/empleado');
        }
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
