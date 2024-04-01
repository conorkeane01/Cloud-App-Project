const path = require('path');
const mongoose = require('mongoose')

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

const shopRoutes = require('./routes/shop');
app.use(express.json()) // Won't parse JSON data sent to server without this
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', shopRoutes.routes);

//app.use((req, res, next) => {
    //  res.status(404).render('404', { pageTitle: 'Page Not Found' });
//});

mongoose.set('strictQuery', true)
mongoose.connect('mongodb://127.0.0.1:27123/db')
    .then(res => {
        app.listen(3000)
    })
    .catch(err => {
        console.log('Mongoose connection error: ' + err)
    });
