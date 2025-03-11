const prisma = require("../config/prisma")
const cloudinary = require('cloudinary').v2;

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.create = async (req, res) => {
    try {
        // code
        const { title, description, price, quantity, categoryId, images } = req.body
        // console.log(title, description, price, quantity, images)
        const product = await prisma.product.create({
            data: {
                title: title,
                description: description,
                price: parseFloat(price),
                quantity: parseInt(quantity),
                categoryId: parseInt(categoryId),
                images: {
                    create: images.map((item) => ({
                        asset_id: item.asset_id,
                        public_id: item.public_id,
                        url: item.url,
                        secure_url: item.secure_url
                    }))
                }
            }
        })
        res.send(product)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server error" })
    }
}
exports.list = async (req, res) => {
    try {
        // code
        // ✅ รับค่า count และ page จาก query parameters
        const { count = 4, page = 1 } = req.query;
        const limit = parseInt(count);
        const skip = (parseInt(page) - 1) * limit;

        // นับสินค้าทั้งหมด
        const totalProducts = await prisma.product.count();
        const totalPages = Math.ceil(totalProducts / limit); // ✅ คำนวณจำนวนหน้า (ค่าที่ส่งมาจากหน้าบ้าน ชิ้นต่อ 1 หน้า)

        // ดึงสินค้าตามหน้า
        const products = await prisma.product.findMany({
            take: limit,
            skip: skip,
            orderBy: { createdAt: "desc" }, // เรียงลำดับโดย createdAt จากใหม่ไปเก่า
            include: { category: true, images: true },
        })
        // // ✅ ส่งค่าจำนวนหน้ากลับไป
        res.send({
            products,
            totalPages,
            currentPage: parseInt(page),
            itemsPerPage: limit
        });
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server error" })
    }
}
exports.read = async (req, res) => {
    try {
        // code
        const { id } = req.params
        const products = await prisma.product.findFirst({
            where: {
                id: Number(id)
            },
            include: {
                category: true,
                images: true
            }
        })
        res.send(products)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server error" })
    }
}
exports.update = async (req, res) => {
    try {
        // code
        const { title, description, price, quantity, categoryId, images } = req.body
        // console.log(title, description, price, quantity, images)

        await prisma.image.deleteMany({
            where: {
                productId: Number(req.params.id)
            }
        })

        const product = await prisma.product.update({
            where: {
                id: Number(req.params.id)
            },
            data: {
                title: title,
                description: description,
                price: parseFloat(price),
                quantity: parseInt(quantity),
                categoryId: parseInt(categoryId),
                images: {
                    create: images.map((item) => ({
                        asset_id: item.asset_id,
                        public_id: item.public_id,
                        url: item.url,
                        secure_url: item.secure_url
                    }))
                }
            }
        })
        res.send(product)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server error" })
    }
}
exports.remove = async (req, res) => {
    try {
        // code
        const { id } = req.params
        // หนังชีวิต 
        // Step 1 ค้นหาสินค้า include images
        const product = await prisma.product.findFirst({
            where: { id: Number(id) },
            include: { images: true }
        })
        if (!product) {
            return res.status(400).json({ message: 'Product not found!!' })
        }
        // console.log(product)
        // Step 2 Promise ลบรูปภาพใน cloud ลบแบบ รอฉันด้วย
        const deletedImage = product.images
            .map((image) =>
                new Promise((resolve, reject) => {
                    // ลบจาก cloud
                    cloudinary.uploader.destroy(image.public_id, (error, result) => {
                        if (error) reject(error)
                        else resolve(result)
                    })
                })
            )
        await Promise.all(deletedImage)
        // Step 3 ลบสินค้า
        await prisma.product.delete({
            where: {
                id: Number(id)
            }
        })

        res.send('Deleted Success')
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server error" })
    }
}
exports.listby = async (req, res) => {
    try {
        // code
        const { sort, order, limit } = req.body
        console.log(sort, order, limit)
        const products = await prisma.product.findMany({
            take: limit,
            orderBy: { [sort]: order },
            include: {
                category: true,
                images: true
            }
        })
        res.send(products)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server error" })
    }
}

const handleQuery = async (req, res, query) => {
    try {
        //code
        const products = await prisma.product.findMany({
            where: {
                OR: [
                    {
                        title: { // ของเดิมค้นหาจาก ชื่อสินค้า
                            contains: query,
                            mode: "insensitive" // ✅ ไม่สนตัวพิมพ์ใหญ่-เล็ก
                        }
                    },
                    {
                        description: { // ค้นหาจาก รายละเอียดสินค้า
                            contains: query,
                            mode: "insensitive" // ✅ ไม่สนตัวพิมพ์ใหญ่-เล็ก
                        }
                    }
                ]
            },
            orderBy: { createdAt: "desc" }, // เรียงลำดับโดย createdAt จากใหม่ไปเก่า
            include: {
                category: true,
                images: true
            }

        })
        res.send(products)
    } catch (err) {
        //err
        console.log(err)
        res.status(500).json({ message: "Search Error" })
    }
}
const handlePrice = async (req, res, priceRange) => {
    try {
        const products = await prisma.product.findMany({
            where: {
                price: {
                    gte: priceRange[0],
                    lte: priceRange[1]
                }
            },
            orderBy: { price: "asc" }, // เรียงลำดับโดย price จากน้อยไปมาก
            include: {
                category: true,
                images: true
            }
        })
        res.send(products)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Server Error ' })
    }
}
const handleCategory = async (req, res, categoryId) => {
    try {
        const products = await prisma.product.findMany({
            where: {
                categoryId: {
                    in: categoryId.map((id) => Number(id))
                }
            },
            orderBy: { createdAt: "desc" }, // เรียงลำดับโดย createdAt จากใหม่ไปเก่า
            include: {
                category: true,
                images: true
            }
        })
        res.send(products)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Server Error ' })
    }
}

exports.searchFilters = async (req, res) => {
    try {
        // code
        console.log("ค่าที่ถูกส่งมาจาก Frontend:", req.body); // ✅ Debug ดูค่าที่ส่งมา
        const { query, category, price } = req.body
        const searchQuery = query ? query.toLowerCase() : ""; // ✅ แปลงเป็นพิมพ์เล็ก

        if (query) {
            console.log('query-->', searchQuery); // ✅ Debug ดูค่าก่อนส่งไป Prisma
            // console.log('query-->', query)
            await handleQuery(req, res, query)
        }
        if (category) {
            console.log('category-->', category)
            await handleCategory(req, res, category)
        }
        if (price) {
            console.log('price-->', price)
            await handlePrice(req, res, price)
        }

        // res.send('Hello searchFilters Product')
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server error" })
    }
}
exports.createImages = async (req, res) => {
    try {
        //code
        // console.log(req.body)
        const result = await cloudinary.uploader.upload(req.body.image, {
            public_id: `YmcShop-${Date.now()}`,
            // public_id: `Roitai-${Date.now()}`,
            resource_type: 'auto',
            folder: 'Ecom2024'
        })
        res.send(result)
    } catch (err) {
        //err
        console.log(err)
        res.status(500).json({ message: "Server Error" })
    }
}
exports.removeImage = async (req, res) => {
    try {
        //code
        const { public_id } = req.body
        // console.log(public_id)
        cloudinary.uploader.destroy(public_id, (result) => {
            res.send('Remove Image Success!!!')
        })

    } catch (err) {
        //err
        console.log(err)
        res.status(500).json({ message: "Server Error" })
    }
}
// ✅ เพิ่มฟังก์ชันนี้
exports.getProductPage = async (req, res) => {
    const { productId } = req.params;
    const { itemsPerPage = 4 } = req.query;

    try {
        // หาลำดับของสินค้าในฐานข้อมูลทั้งหมด
        const allProducts = await prisma.product.findMany({
            orderBy: { createdAt: "desc" }, // เรียงลำดับตาม createdAt จากใหม่ไปเก่า
        });
        const productIndex = allProducts.findIndex(p => p.id === parseInt(productId));

        if (productIndex === -1) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // คำนวณหน้า
        const page = Math.floor(productIndex / itemsPerPage) + 1;
        console.log("📦 คำนวณหน้าได้:", page); // ✅ เพิ่ม log เพื่อตรวจสอบ
        res.json({ page }); // ✅ ส่งค่ากลับเป็น JSON
    } catch (error) {
        res.status(500).json({ error: 'Failed to calculate page' });
    }
};