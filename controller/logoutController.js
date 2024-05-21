// controller/logoutController.js
exports.logout = (req, res) => {
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                console.error('Error al cerrar sesión:', err);
                return res.status(500).send('Error al cerrar sesión');
            } else {
                // Redirigir a la página de inicio de sesión
                res.redirect('/login');
            }
        });
    } else {
        // En caso de que no haya sesión, redirigir a la página de inicio de sesión
        res.redirect('/login');
    }
};