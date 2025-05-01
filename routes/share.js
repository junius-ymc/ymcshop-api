const express = require('express');
const router = express.Router();

router.get('/share/*', (req, res) => {
  const targetPath = req.originalUrl.replace('/share', '');
  const fullUrl = `https://ymcshop.vercel.app${targetPath}`;
  res.redirect(fullUrl);
});

module.exports = router;