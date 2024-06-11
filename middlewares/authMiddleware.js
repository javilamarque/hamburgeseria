// middlewares/authMiddleware.js
function ensureAuthenticated(req, res, next) {
    if (!req.session.userRole) {
        return res.redirect('/login');
    }
    next();
}

module.exports = ensureAuthenticated;