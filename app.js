const express = require('express');
const hbs = require('hbs');
const cors = require('cors');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const session = require('express-session');
const userRoute = require('./routes/userRoute');
const productRoute = require('./routes/productRoute');
const logoutRoute = require('./routes/logoutRoute');
const ventaRoute = require('./routes/ventaRoute');
const cajaRoute = require('./routes/cajaRoute')
const handlebarsMoment = require('handlebars.moment');

const app = express();

handlebarsMoment.registerHelpers(hbs.handlebars);

app.use(session({
    secret: 'mysecret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Cambia a true si estás usando HTTPS
}));

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
    res.render('home');
});
app.get('/empleado', (req, res) => {
    res.render('empleado');
});
app.get('/newProduct', (req, res) => {
    res.render('newProduct');
});
app.get('/login', (req, res) => {
    res.render('login');
});

app.use('/', userRoute);
app.use('/', productRoute);
app.use('/', ventaRoute);
app.use('/', logoutRoute);
app.use('/', cajaRoute)

require('dotenv').config({ path: './.env' });

const port = process.env.PORT || 3005;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});