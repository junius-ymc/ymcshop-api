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
  getDailySales,
  getMonthlySales
} = require('../controllers/admin')

router.put('/admin/order-status', authCheck, changeOrderStatus)
router.get('/admin/orders', authCheck, getOrderAdmin)
router.get('/admin/dashboard-stats', authCheck, getDashboardStats)
router.get('/admin/recent-orders', authCheck, getRecentOrders)
router.get('/admin/chart-daily-sales', authCheck, getDailySalesChart)
router.get('/admin/daily-sales', authCheck, getDailySales)
router.get('/admin/chart-monthly-sales', authCheck, getMonthlySales)

module.exports = router