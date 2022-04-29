const mongoose = require('mongoose');
const crypto = require('crypto');

const secret = 'password';
const pass = crypto.createHmac('sha256', secret).update('password123').digest('hex');

const db = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/db-test";
mongoose.connect(db, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
});

const User = require('../model/user');

User.find({ username: 'supermember' }, (err, res) => {
    if (res.length == 0) {
        const admin = new User({
            username: 'supermember',
            email: 'member@mail.com',
            password: pass,
            name: 'Super Member'
        });

        admin.save((err) => {
            if (err) throw err;
            console.log('Member is created.');
        });
    };
});