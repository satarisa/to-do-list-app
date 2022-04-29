const { urlencoded } = require('express');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const { body, validationResult, check } = require('express-validator');
const crypto = require('crypto');
const Auth = require('./middleware/auth');
const secret = 'password';

var session_storage;

const port = 3000;
const app = express();

require('./utils/db');
const User = require('./model/user');
const List = require('./model/list');

const oneDay = 1000 * 60 * 60 * 24;

app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static('public'));
app.use(urlencoded({extended: true}));
app.use(cookieParser('secret'));
app.use(session({
    cookie: { maxAge: oneDay },
    secret: 'secret',
    resave: true,
    saveUninitialized: false
}));
app.use(flash());
app.use(methodOverride('_method'));

// Home page
app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', (req, res, next) => {
    res.render('login', {
        layout: 'layouts/login-regist-layout',
        title: 'Login Page',
        msg: req.flash('msg'),
        msginfo: req.flash('msg-info'),
    });
});

// login 
app.post('/login', async (req, res, next) => {
    session_storage = req.session;
    const password = crypto.createHmac('sha256', secret).update(req.body.password).digest('hex');

    const acc = await User.findOne({ username: req.body.username, password: password });

    if (acc) {
        req.session.username = acc.username;
        req.session.email = acc.email;
        req.session.name = acc.name;
        req.session.admin = acc.admin;
        req.session._id = acc._id;
        req.session.logged_in = true;
        res.redirect('/home');
    } else {
        req.flash('msg', 'Wrong account!');
        res.redirect('/login');
    }
});

// register page
app.get('/register', (req, res, next) => {
    res.render('register', {
        layout: 'layouts/login-regist-layout',
        title: 'Register Page',
    });
});

// sign up
app.post('/register', [
    body('username').custom(async (value) => {
        const checkDuplicate = await User.findOne({username: value});
        if (checkDuplicate) {
            throw new Error('Username already registered. Use another one!');
        }
        return true;
    }),
    check('password', 'Password must have at least 6 characters!').isLength({ min: 6 }),
    body('re-password').custom((value, {req}) => {
        if (value !== req.body.password) {
            throw new Error('Password did not match!');
        }
        return true;
    }),
    check('email', 'Email is invalid').isEmail(),
], (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        res.render('register', {
            title: 'Register Page',
            layout: 'layouts/login-regist-layout',
            errors: error.array()
        });
    } else {
        User.insertMany([
            {
                username: req.body.username,
                password: crypto.createHmac('sha256', secret).update(req.body.password).digest('hex'),
                email: req.body.email,
                name: req.body.name
            }
        ], (error, result) => {
            req.flash('msg-info', 'Successfully registered!');
            res.redirect('/login');
        });
    };
});

// home page app
app.get('/home', Auth.checkLogin, async (req, res, next) => {
    session_storage = req.session;
    const list = await List.find({ userid: req.session._id });
    
    res.render('index', {
        layout: 'layouts/main-layout',
        title: 'Welcome',
        session_storage,
        list
    });
});

// insert new data
app.post('/home', (req, res) => {
    List.insertMany(req.body).then((result) => {
        res.redirect('/home');
    });
})

// check list data
app.delete('/home', (req, res) => {
    List.deleteOne({
        _id: req.body._id
    }).then((result) => {
        res.redirect('/home');
    });
});

// logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/login');
        }
    })
})

app.listen(port, () => {
    console.log(`To Do List App | listening at http://localhost:${port}`);
});