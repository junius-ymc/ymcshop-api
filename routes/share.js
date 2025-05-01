app.get('/prerender/*', (req, res) => {
  // ส่งไปที่ frontend
  res.redirect(`https://ymcshop.vercel.app${req.path.replace('/prerender', '')}${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`);
});