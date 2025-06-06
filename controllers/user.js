const prisma = require("../config/prisma");
const axios = require("axios");

exports.listUsers = async (req, res) => {
  try {
    //code
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        enabled: true,
        address: true,
        name: true,
        picture: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json(users);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
exports.changeStatus = async (req, res) => {
  try {
    //code
    const { id, enabled } = req.body;
    console.log(id, enabled);
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { enabled: enabled },
    });

    res.send("Update Status Success");
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
exports.changeRole = async (req, res) => {
  try {
    //code
    const { id, role } = req.body;

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { role: role },
    });

    res.send("Update Role Success");
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
exports.userCart = async (req, res) => {
  try {
    //code
    const { cart, shippingFee, grandTotal } = req.body;
    console.log(cart);
    console.log(req.user.id);

    const user = await prisma.user.findFirst({
      where: { id: Number(req.user.id) },
    });
    // console.log(user)

    // Check quantity
    for (const item of cart) {
      // console.log(item)
      const product = await prisma.product.findUnique({
        where: { id: item.id },
        select: { quantity: true, title: true },
      });
      // console.log(item)
      // console.log(product)
      if (!product || item.count > product.quantity) {
        return res.status(400).json({
          ok: false,
          message: `ขออภัย. สินค้า ${product?.title || "product"} หมด`,
        });
      }
    }

    // Deleted old Cart item
    await prisma.productOnCart.deleteMany({
      where: {
        cart: {
          orderedById: user.id,
        },
      },
    });
    // Deeted old Cart
    await prisma.cart.deleteMany({
      where: { orderedById: user.id },
    });

    // เตรียมสินค้า
    let products = cart.map((item) => ({
      productId: item.id,
      count: item.count,
      price: item.price,
    }));

    // หาผลรวม
    let cartTotal = products.reduce(
      (sum, item) => sum + item.price * item.count,
      0
    );

    // New cart
    const newCart = await prisma.cart.create({
      data: {
        products: {
          create: products,
        },
        cartTotal: cartTotal,
        orderedById: user.id,
        shippingFee,
        grandTotal,
      },
    });
    console.log(newCart);
    res.send("Add Cart Ok");
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
exports.getUserCart = async (req, res) => {
  try {
    //code
    // req.user.id
    const cart = await prisma.cart.findFirst({
      where: {
        orderedById: Number(req.user.id),
      },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });
    console.log(cart);
    res.json({
      products: cart.products,
      cartTotal: cart.cartTotal,
      grandTotal: cart.grandTotal,
      shippingFee: cart.shippingFee,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
exports.emptyCart = async (req, res) => {
  try {
    //code
    const cart = await prisma.cart.findFirst({
      where: { orderedById: Number(req.user.id) },
    });
    if (!cart) {
      return res.status(400).json({ message: "No cart" });
    }
    await prisma.productOnCart.deleteMany({
      where: { cartId: cart.id },
    });
    const result = await prisma.cart.deleteMany({
      where: { orderedById: Number(req.user.id) },
    });

    console.log(result);
    res.json({
      message: "Cart Empty Success",
      deletedCount: result.count,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
exports.saveAddress = async (req, res) => {
  try {
    //code
    const { address, name } = req.body;
    console.log(address);
    const addresssUser = await prisma.user.update({
      where: {
        id: Number(req.user.id),
      },
      data: {
        address: address,
        name: name,
      },
    });

    res.json({ ok: true, message: "Address update success", msgfromapi: '1' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error", msgfromapi: '2' });
  }
};
exports.saveOrder = async (req, res) => {
  try {
    //code
    // Step 0 Check Stripe
    // console.log(req.body)
    // return res.send('hello Jukkru!!!')
    // stripePaymentId String
    // amount          Int
    // status          String
    // currentcy       String
    const { id, amount, status, currency } = req.body.paymentIntent;

    // Step 1 Get User Cart
    const userCart = await prisma.cart.findFirst({
      where: {
        orderedById: Number(req.user.id),
      },
      include: { products: true },
    });

    // Check Cart empty
    if (!userCart || userCart.products.length === 0) {
      return res.status(400).json({ ok: false, message: "Cart is Empty" });
    }

    const amountTHB = Number(amount) / 100;
    // Create a new Order
    const order = await prisma.order.create({
      data: {
        products: {
          create: userCart.products.map((item) => ({
            productId: item.productId,
            count: item.count,
            price: item.price,
          })),
        },
        orderedBy: {
          connect: { id: req.user.id },
        },
        cartTotal: userCart.cartTotal,
        stripePaymentId: id,
        amount: amountTHB,
        status: status,
        currentcy: currency,
      },
    });
    // stripePaymentId String
    // amount          Int
    // status          String
    // currentcy       String

    // Update Product
    const update = userCart.products.map((item) => ({
      where: { id: item.productId },
      data: {
        quantity: { decrement: item.count },
        sold: { increment: item.count },
      },
    }));
    console.log(update);

    await Promise.all(update.map((updated) => prisma.product.update(updated)));

    await prisma.cart.deleteMany({
      where: { orderedById: Number(req.user.id) },
    });
    res.json({ ok: true, order });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
exports.getOrder = async (req, res) => {
  try {
    //code
    const orders = await prisma.order.findMany({
      where: { orderedById: Number(req.user.id) },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });
    if (orders.length === 0) {
      return res.status(400).json({ ok: false, message: "No orders" });
    }

    res.json({ ok: true, orders });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getUserLocation = async (req, res) => {
  try {
    const clientIp =
      req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

    // ✅ ป้องกัน IP localhost ให้ใช้ IP จริงแค่ตอน dev เท่านั้น
    if (
      process.env.NODE_ENV !== "production" &&
      (clientIp === "::1" || clientIp.startsWith("127.") || clientIp.includes("::ffff:127"))
    ) {
      clientIp = "8.8.8.8"; // ใช้ IP จริงจำลอง เช่น Google Public DNS
    }

    // const { data } = await axios.get(`https://ipapi.co/${clientIp}/json/`);
    // const country = data.country_name || "Unknown";
    // const countryCode = data.country || "xx";

    // เอาไว้ทดสอบ
    const country = "🇹🇭 ไทย";
    const countryCode = "my";
    console.log("countryCode:", countryCode);

    res.json({
      country,
      countryCode: countryCode.toLowerCase(),
      ip: clientIp,
    });
  } catch (err) {
    console.error("Geo error:", err.message);
    res.status(500).json({ error: "ไม่สามารถดึง location ได้" });
  }
};