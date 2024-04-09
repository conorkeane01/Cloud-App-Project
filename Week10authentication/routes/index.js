const express = require('express');
const router = express.Router();
require('dotenv').config()
const bcrypt = require('bcryptjs')
const jwt = require("jsonwebtoken");
const jwtString = process.env.JWT_STRING

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const productSchema = new Schema({
  name: { type: String, required: true },
  ourId: { type: String, required: true },
  anArray: { type: Array, required: false },
  anObject: { type: Object, required: false },
  imageUrl: { type: String, required: true } 
})

const userSchema = new Schema({
  email: { type: String, required: true },
  cartId: { type: Number, required: true },
  password: { type: String, required: true },

})
const Product = mongoose.model('product', productSchema) // 'product' refers to the collection, so maps products collection to productSchema; see lecture notes
const User = mongoose.model('User', userSchema)

const Auth = require('./auth')

router.post('/addProduct', Auth,(req, res, next) => {
  let nextProductId = 1
  new Product({ ourId: '9' + nextProductId, name: req.body.title, size: 'large', imageUrl: req.body.imageUrl })
    .save()
    .then(result => {
      nextProductId++
      console.log('saved product to database')
      res.redirect('/')
    })
    .catch(err => {
      console.log('failed to addAproduct: ' + err)
      res.redirect('/')
    })
})

router.get('/', (req, res, next) => {
  Product.find() // Always returns an array
    .then(products => {
      res.json({ 'All the Products': products })
    })
    .catch(err => {
      console.log('Failed to find: ' + err)
      res.json({ 'Products': [] })
    })
})




router.get('/deleteSpecificProduct', (req, res, next) => {
  if (!req.session.loggedIn) {
    res.send({ success: false })
  }

  Product.findOneAndRemove({ ourId: '0' })
    .then(resp => {
      res.send({ success: true })
    })
    .catch(err => {
      console.log('Failed to find product: ' + err)
      res.send({ success: false })
    })
})


router.post('/signin', async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password.trim(); // Trim the password
  
 
    const user = await User.findOne({ email: email });
  
    if (!user) {
      return res.json({ success: false, message: "User doesn't exist" });
    }
    const checkPass = await bcrypt.compare(password + process.env.EXTRA_BCRYPT_STRING, user.password);
  
    if (checkPass) {
      res.setHeader('Set-Cookie', 'isLoggedIn=true');
      return res.json({ success: true, message: `Welcome: ${email}` });
    } else {
      console.log('Comparison failed');
      return res.json({ success: false, message: "Incorrect password" });
    }
 
});
router.get('/showUsers', (req, res, next) => {
  User.find() // Always returns an array
    .then(users => {
      res.send({success: true, 'All the Users': users })
    })
    .catch(err => {
      console.log('Failed to find: ' + err)
      res.send({ success: false,'Products': [] })
    })
})

router.post('/signup', (req, res, next) => {
  console.log(req.body.email)
  console.log(req.body.password)
  email = req.body.email.trim()
  password = req.body.password.trim()
  password = bcrypt.hashSync(password + process.env.EXTRA_BCRYPT_STRING, 12)
  new User({ email: req.body.email , password: password, cartId: 1 })
    .save()
    .then(result => {
    
      console.log('saved user to database')
      res.redirect('/')
    })
    .catch(err => {
      console.log('failed to user: ' + err)
      res.redirect('/')
    })
})

router.get('/signout', (req, res, next) => {
  let loggedIn = req.session.isLoggedIn
  req.session.isLoggedIn = false
  console.log(loggedIn)
  res.clearCookie('isLoggedIn')
  res.send({success: true,message:'done: ' + loggedIn})
})

exports.routes = router
