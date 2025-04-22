const prisma = require("../config/prisma")

exports.changeOrderStatus = async (req, res) => {
    try {
        const { orderId, orderStatus } = req.body
        // console.log(orderId, orderStatus)
        const orderUpdate = await prisma.order.update({
            where: { id: orderId },
            data: { orderStatus: orderStatus }
        })

        res.json(orderUpdate)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server error" })
    }
}
exports.getOrderAdmin = async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                products: {
                    include: {
                        product: true
                    }
                },
                orderedBy: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        address: true,
                    }
                }
            }
        })
        res.json(orders)
    } catch (err) {
        console.log(errr)
        res.status(500).json({ message: "Server error" })
    }
}

exports.getDashboardStats = async (req, res) => {
    try {
        const [orders, users, products, contacts, reviews] = await Promise.all([
            prisma.order.findMany(),
            prisma.user.findMany(),
            prisma.product.findMany(),
            prisma.contact.findMany(),
            prisma.review.findMany(),
        ]);

        // ✅ นับข้อมูล "วันนี้"
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const ordersToday = orders.filter(o => new Date(o.createdAt) >= today).length;
        const usersToday = users.filter(u => new Date(u.createdAt) >= today).length;
        const contactsToday = contacts.filter(c => new Date(c.createdAt) >= today).length;
        const reviewsToday = reviews.filter(r => new Date(r.createdAt) >= today).length;

        res.json({
            totalOrders: orders.length,
            totalUsers: users.length,
            totalProducts: products.length,
            totalContacts: contacts.length,
            totalReviews: reviews.length,
            ordersToday,
            usersToday,
            contactsToday,
            reviewsToday,
        });
    } catch (err) {
        console.error("❌ Dashboard Stats Error:", err);
        res.status(500).send("Server Error");
    };
};

exports.getRecentOrders = async (req, res) => {
    try {
        const recentOrders = await prisma.order.findMany({
            orderBy: {
                createdAt: "desc",
            },
            take: 5,
            include: {
                orderedBy: true, // ดึงชื่อผู้สั่ง
            },
        });

        res.json(recentOrders);
    } catch (error) {
        console.error("❌ Error fetching recent orders:", error);
        res.status(500).json({ message: "Server Error" });
    }
};