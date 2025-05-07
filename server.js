// Step 1 import ....
const express = require('express')
const app = express()
const morgan = require('morgan')
const { readdirSync } = require('fs')
const cors = require('cors')
const path = require('path');
const prerender = require('prerender-node');

// ✅ ถ้าคุณมี token จาก https://prerender.io → ใส่ตรงนี้
prerender.set('prerenderToken', 'MJVQROCR6ltrN10nVTn3');

// ✅ ใช้งาน prerender middleware ก่อน static
app.use(prerender);

// middleware
// routes auto-import
app.use(morgan('dev'))
app.use(express.json({ limit: '20mb' }))
app.use(cors())
// app.use('/api',authRouter)
// app.use('/api',categoryRouter)
readdirSync('./routes')
    .map((c) => app.use('/api', require('./routes/' + c)))

// ✅ Serve static frontend (React build)
app.use(express.static(path.join(__dirname, '../client/dist')));

// ✅ Fallback ให้ React จัดการ route ที่เหลือ
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Step 3 Router
// app.post('/api',(req,res)=>{
//     // code
//     const { username,password } = req.body
//     console.log(username,password)
//     res.send('Jukkru 555+')
// })

// Step 2 Start Server
// app.listen(5001,
//     () => console.log('Server is running on port 5001'))

// Step 2 Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));


