const express = require('express');
const router = express.Router();

router.get('/prerender/*', (req, res) => {
  const targetPath = req.path.replace('/prerender', '');
  const query = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
  const redirectUrl = `https://ymcshop.vercel.app${targetPath}${query}`;
  res.redirect(redirectUrl);
});

module.exports = router;