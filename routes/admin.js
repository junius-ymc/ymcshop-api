// import ....
const express = require('express')
const { authCheck } = require('../middlewares/authCheck')
const router = express.Router()
// import controller
const {
  getOrderAdmin,
  changeOrderStatus,
  getDashboardStats
} = require('../controllers/admin')

router.put('/admin/order-status', authCheck, changeOrderStatus)
router.get('/admin/orders', authCheck, getOrderAdmin)
router.get('/admin/dashboard-stats', authCheck, getDashboardStats)

module.exports = router