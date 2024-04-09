const Auth = (req, res, next) => {
    console.log(req.cookies.isLoggedIn)
    if (req.cookies.isLoggedIn === 'true') {
      next()
    } else {
      res.redirect('/')
    }
  }
  module.exports = Auth