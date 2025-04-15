// import ....
const express = require('express')
const { authCheck, adminCheck } = require('../middlewares/authCheck')
const router = express.Router()
// import controller
const { postcontactus, listcontactus, removecontactus } = require('../controllers/contact')

router.post('/contact', postcontactus);
router.get('/contact', authCheck, listcontactus);
router.delete('/contact/:id', authCheck, adminCheck, removecontactus)


module.exports = router