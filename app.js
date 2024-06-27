const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const hbs = require('hbs');
const cors = require('cors');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const handlebarsMoment = require('handlebars.moment');
const moment = require('moment');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

// Importar rutas
const userRoute = require('./routes/userRoute');
const productRoute = require('./routes/productRoute');
const logoutRoute = require('./routes/logoutRoute');
const ventaRoute = require('./routes/ventaRoute');
const cajaRoute = require('./routes/cajaRoute');
const comboRoute = require('./routes/comboRoute');

const app = express();

// Configurar la ruta para archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Configurar Handlebars
hbs.registerPartials(path.join(__dirname, '/views/partials'));
handlebarsMoment.registerHelpers(hbs.handlebars);

hbs.registerHelper('now', () => new Date().getTime());
hbs.registerHelper('date', (date, format) => {
    let momentDate = moment(date, ["YYYY-MM-DDTHH:mm:ssZ", "DD-MM-YYYY", "DD/MM/YYYY", moment.ISO_8601, "LLLL"], true);
    if (!momentDate.isValid()) {
        momentDate = moment(new Date(date));
    }
    if (!momentDate.isValid()) {
        momentDate = moment();
    }
    return momentDate.format(format);
});
hbs.registerHelper('subtract', (a, b) => a - b);
hbs.registerHelper('divide', (a, b) => a / b);
hbs.registerHelper('gt', (a, b) => a > b);
hbs.registerHelper('eq', (a, b) => a === b);
hbs.registerHelper('or', (a, b) => a || b);

// Helper para convertir objetos en JSON
hbs.registerHelper('json', function (context) {
    return JSON.stringify(context);
});

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Configuración de la sesión
app.use(session({
    secret: process.env.SESSION_SECRET || 'mysecret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/burger' })
}));

// Middleware
app.use(cors());
app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Middleware para deshabilitar la caché
const disableCache = (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
};

app.use(disableCache);

// Middleware para verificar la autenticación
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userRole) {
        return next();
    } else {
        res.redirect('/login');
    }
};


// Rutas
app.get('/',  (req, res) => {
    res.render('login');
});

app.get('/admin/home', disableCache, isAuthenticated, (req, res) => {
    if (!req.session.userRole) {
        return res.redirect('/login');
    }
    res.render('admin/home', { userRole: req.session.userRole });
});

app.get('/newProduct', disableCache, isAuthenticated, (req, res) => {
    res.render('newProduct');
});

app.get('/login',  (req, res) => {
    res.render('login');
});

app.get('/createCombo', disableCache, isAuthenticated, (req, res) => {
    res.render('createCombo');
});





app.use('/', userRoute);
app.use('/', productRoute);
app.use('/', ventaRoute);
app.use('/', logoutRoute);
app.use('/', cajaRoute);
app.use('/', comboRoute);
app.use('/sales', productRoute);



// Iniciar el servidor
const port = process.env.PORT || 3005;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});