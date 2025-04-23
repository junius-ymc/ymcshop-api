// import ....
const express = require('express')
const { authCheck } = require('../middlewares/authCheck')
const router = express.Router()
// import controller
const {
  getOrderAdmin,
  changeOrderStatus,
  getDashboardStats,
  getRecentOrders,
  getDailySalesChart,
  getDailySales
} = require('../controllers/admin')

router.put('/admin/order-status', authCheck, changeOrderStatus)
router.get('/admin/orders', authCheck, getOrderAdmin)
router.get('/admin/dashboard-stats', authCheck, getDashboardStats)
router.get('/admin/recent-orders', authCheck, getRecentOrders)
router.get('/admin/chart-daily-sales', authCheck, getDailySalesChart)
router.get('/admin/daily-sales', authCheck, getDailySales)

module.exports = router