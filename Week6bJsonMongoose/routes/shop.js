const express = require('express');
const router = express.Router();

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const productSchema = new Schema({
  name: { type: String, required: true },
  ourId: { type: String, required: true },
  anArray: { type: Array, required: false },
  anObject: { type: Object, required: false },
  imageUrl: { type: String, required: true } 
})

const Product = mongoose.model('product', productSchema) // 'product' refers to the collection, so maps products collection to productSchema; see lecture notes

let nextProductId = 0
router.post('/addProduct', (req, res, next) => {
  console.log(req.body)
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
      res.json({'All the Products': products})
    })
    .catch(err => {
      console.log('Failed to find: ' + err)
      res.json({'Products': []})
    })
})

router.post('/', (req, res, next) => {
  console.log(req.body.testData)
  Product.find() // Always returns an array
    .then(products => {
      res.json({'POST Mongoose Products': products})
    })
    .catch(err => {
      console.log('Failed to find: ' + err)
      res.json({'Products': []})
    })
})

router.get('/getSpecificProduct', (req, res, next) => {
  Product.find({ ourId: '1'}) // Always returns an array
    .then(products => {
      res.send('getSpecificProduct: ' + JSON.stringify(products[0])) // Return the first one found
    })
    .catch(err => {
      console.log('Failed to find product: ' + err)
      res.send('No product found')
    })
})

router.get('/updateSpecificProduct', (req, res, next) => {
  Product.find({ ourId: '1'}) // Always returns an array
    .then(products => {
      let specificProduct = products[0] // pick the first match
      specificProduct.price = 199.95
      specificProduct.save() // Should check for errors here too
      res.redirect('/')
    })
    .catch(err => {
      console.log('Failed to find product: ' + err)
      res.send('No product found')
    })
})

router.get('/deleteSpecificProduct', (req, res, next) => {
  Product.findOneAndRemove({ ourId: '0'}) 
    .then(resp => {
      res.redirect('/')
    })
    .catch(err => {
      console.log('Failed to find product: ' + err)
      res.send('No product found')
    })
})

exports.routes = router
