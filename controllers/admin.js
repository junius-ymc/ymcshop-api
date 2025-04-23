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

exports.getDailySalesChart = async (req, res) => {
    try {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const today = new Date();

        const sales = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: startOfMonth,
                    lte: today
                },
                status: "succeeded"
            },
        });

        // รวมยอดขายต่อวัน
        const summary = {};
        sales.forEach(order => {
            const day = new Date(order.createdAt).toISOString().split("T")[0]; // yyyy-mm-dd
            if (!summary[day]) summary[day] = 0;
            summary[day] += order.cartTotal;
        });

        // แปลงให้ frontend ใช้ง่าย
        const result = Object.keys(summary).map(day => ({
            date: day,
            total: summary[day]
        }));

        res.json(result);
    } catch (err) {
        console.error("❌ Error in getDailySalesChart:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getDailySales = async (req, res) => {
    try {
        const start = new Date();
        start.setDate(1); // วันแรกของเดือนนี้
        start.setHours(0, 0, 0, 0);

        const end = new Date(); // วันปัจจุบัน

        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: start,
                    lte: end,
                },
            },
        });

        // Group by day
        const dailySales = {};

        orders.forEach((order) => {
            const date = order.createdAt.toISOString().slice(0, 10); // yyyy-mm-dd
            dailySales[date] = (dailySales[date] || 0) + order.amount;
        });

        // Convert to array
        const result = Object.entries(dailySales).map(([date, totalSales]) => ({
            date,
            totalSales,
        }));

        res.json(result);
    } catch (err) {
        console.error("❌ Error in getDailySales:", err);
        res.status(500).json({ message: "Server Error" });
    }
};