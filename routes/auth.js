// import ....
const express = require('express')
const router = express.Router()
// import controller
const { 
  register, 
  login, 
  currentUser,
  forgotPassword,
  resetPassword
 } = require('../controllers/auth')
// import Middleware
const { authCheck, adminCheck } = require('../middlewares/authCheck')

router.post('/register', register)
router.post('/login', login)
router.post('/current-user', authCheck, currentUser)
router.post('/current-admin', authCheck, adminCheck, currentUser)
router.post("/forgot-password", forgotPassword)
router.post("/reset-password", resetPassword)

module.exports = router