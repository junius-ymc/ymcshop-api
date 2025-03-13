const express = require('express')
const router = express.Router()
// Controllers
const { create,
    list,
    read,
    update,
    remove,
    listby,
    searchFilters,
    createImages,
    removeImage,
    getProductPage // ✅ เพิ่มฟังก์ชันนี้
} = require('../controllers/product')
const { authCheck, adminCheck } = require('../middlewares/authCheck')
// @ENDPOINT https://ymc-shop-api.vercel.app/api/product
router.post('/product', create)
router.get('/products/:count', list);
router.get('/product/:id', read)
router.put('/product/:id', update)
router.delete('/product/:id', remove)
router.post('/productby', listby)
router.post('/search/filters', searchFilters)

router.post('/images', authCheck, adminCheck, createImages)
router.post('/removeimages', authCheck, adminCheck, removeImage)


module.exports = router