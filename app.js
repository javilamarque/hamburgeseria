const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const hbs = require('hbs');
const cors = require('cors');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const userRoute = require('./routes/userRoute');
const productRoute = require('./routes/productRoute');
const logoutRoute = require('./routes/logoutRoute');
const ventaRoute = require('./routes/ventaRoute');
const cajaRoute = require('./routes/cajaRoute')
const comboRoute = require('./routes/comboRoute')
const handlebarsMoment = require('handlebars.moment');

const app = express();

handlebarsMoment.registerHelpers(hbs.handlebars);
// Registro del helper eq en Handlebars
hbs.registerHelper('eq', function (a, b) {
    return a === b;
});

app.use(session({
    secret: process.env.SESSION_SECRET || 'mysecret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },// Cambiar a true si estás usando HTTPS
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/burger' })
}));

const authMiddleware = (role) => {
    return (req, res, next) => {
        if (!req.session.userRole) {
            return res.redirect('/login');
        }
        if (role && req.session.userRole !== role) {
            return res.status(403).send('No tienes permiso para acceder a esta página');
        }
        next();
    };
};

app.use(cors());
app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'hbs');

hbs.registerPartials(__dirname + '/views/partials');
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('login');
});
app.get('/admin', (req, res) => {
    res.render('admin/home');
});
app.get('/empleado', (req, res) => {
    res.render('empleado/empleado');
});
app.get('/newProduct', (req, res) => {
    res.render('newProduct');
});
app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/createCombo', (req, res) => {
    res.render('createCombo');
})

app.use('/', userRoute);
app.use('/', productRoute);
app.use('/', ventaRoute);
app.use('/', logoutRoute);
app.use('/', cajaRoute)
app.use('/', comboRoute)
app.use('/admin/home', authMiddleware('admin'));
app.use('/empleado / empleado', authMiddleware('empleado'));

require('dotenv').config({ path: './.env' });

const port = process.env.PORT || 3005;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});