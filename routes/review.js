// import ....
const express = require('express')
const { authCheck, adminCheck } = require('../middlewares/authCheck')
const router = express.Router()
// import controller
const {
  getEnabledReviews,
  postReview,
  listReview,
  readReview,
  updateReview,
  removeReview,
  toggleReviewEnabled,
  createImages,
  removeImage
} = require('../controllers/review')

router.get('/review/enabled', getEnabledReviews); // ลำดับความสำคัญน้อยสุดจะต้องอยู่ด้านบน
router.post('/review', authCheck, postReview);
router.get('/review', authCheck, listReview);
router.get('/review/:id', authCheck, readReview);
router.put('/review/:id', authCheck, updateReview);
router.delete('/review/:id', authCheck, removeReview);
router.put('/review/toggle/:id', authCheck, toggleReviewEnabled);

router.post('/review/createimages', authCheck, createImages);
router.post('/review/removeimages', authCheck, removeImage);


module.exports = router