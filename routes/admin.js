var express = require('express');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();
var productHelper = require('../helpers/product-helpers');

const verifyAdminLogin = (req, res, next) => {
  if (req.session.admin.loggedIn) {
    next()
  }
  else {
    res.redirect('/admin')
  }
}

/* GET users listing. */
router.get('/', function (req, res,) {

  console.log(req.session.admin);
  if (req.session.admin) {
    productHelpers.getAllProduct().then((products) => {
      res.render('admin/view-products', { admin: req.session.admin, products })
    })
  }
  else {
    res.render('admin/admin-login', { "adminloginErr": req.session.adminLoginErr, admin: true })
    req.session.adminLoginErr = false
  }

});

router.get('/add-product', (req, res) => {
  res.render('admin/add-product', { admin: true })
})

router.post('/add-product', (req, res) => {
  console.log(req.body)
  console.log(req.files.img)
  productHelpers.addProduct(req.body, (id) => {
    let image = req.files.img
    image.mv('./public/product-images/' + id + '.jpg', (err, done) => {
      if (!err)
        res.render('admin/add-product', { admin: true })
    })

  })
})

router.get('/delete-product/:id', (req, res) => {
  let proId = req.params.id
  productHelpers.deleteProduct(proId).then((response) => {
    res.redirect('/admin/')
  })


})

router.get('/edit-product/:id', async (req, res) => {
  let products = await productHelpers.getProductDetails(req.params.id)
  console.log(products)
  res.render('admin/edit-product', { products })
})

router.post('/edit-product/:id', (req, res) => {
  productHelpers.updateProduct(req.params.id, req.body).then(() => {
    id = req.params.id
    res.redirect('/admin')
    if (req.files.img) {
      let image = req.files.img
      image.mv('./public/product-images/' + id + '.jpg')
    }
  })
})

router.get('/admin-signup',(req,res) =>
{
  res.render('admin/admin-signup');
})

router.post('/admin/admin-signup', (req, res) => {
  productHelpers.adminSignup(req.body).then((response) => {
    console.log(response);
  })
})

router.post('/admin-login', (req, res) => {
  productHelpers.adminLogin(req.body).then((response) => {
    if (response.status)
    {
      req.session.admin = response.admin
      req.session.admin.loggedIn = true
      productHelpers.getAllProduct().then((products) => {
        res.render('admin/view-products', { admin: req.session.admin, products })
      })
    }
    else {
      req.session.adminLoginErr = "Admin Does not exist..!!"
      res.redirect('/admin')
    }
  })
})

router.get('/admin-logout', (req, res) => {
  req.session.admin = null
  req.session.adminLoggedIn = false
  res.redirect('/admin')
})

router.get('/all-users',(req, res) =>
{
  productHelpers.getAllUsers().then((userData) =>
  {
    res.render('admin/all-users',{userData,admin:true})
  })
  
})

router.get('/all-orders', async (req, res) =>
{
  let orders = await productHelpers.getAllOrders(req.session.admin._id)

  res.render('admin/all-orders',{orders,admin:true})
})

router.get('/all-products', (req, res) =>
{
  productHelpers.getAllProduct().then((products) => {
    res.render('admin/view-products', { admin:true, products })
  })
})

module.exports = router;
