const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');
const { readdirSync } = require('fs');
const prerender = require('prerender-node');

// ✅ ใส่ Prerender Token ตรงนี้
prerender.set('prerenderToken', 'MJVQROCR6ltrN10nVTn3');

// ✅ log เวลา bot เข้า (optional แต่แนะนำ)
prerender.set('beforeRender', function (req, done) {
  console.log('🤖 BOT DETECTED:', req.headers['user-agent']);
  done();
});

// ✅ ใช้ Prerender Middleware ก่อนทุกอย่าง
app.use(prerender);

// ✅ ตั้งค่า CORS
app.use(cors({
  origin: ['https://ymcshop.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// ✅ Middleware ทั่วไป
app.use(morgan('dev'));
app.use(express.json({ limit: '20mb' }));

// ✅ โหลด route ทั้งหมด
readdirSync('./routes').map((file) => {
  app.use('/api', require('./routes/' + file));
});

// ✅ ไม่ต้องใช้ routes/share.js แล้วนะ (ลบออกได้)

const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log('✅ SERVER RUNNING ON PORT', port);
});
