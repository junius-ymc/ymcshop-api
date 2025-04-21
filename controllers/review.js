// ✅ File 4: review.js (Backend) — updated for dynamic image naming
const prisma = require("../config/prisma");
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.postReview = async (req, res) => {
    const { userName, reviewProduct, reviewProductId, orderedId, image } = req.body;
    try {
        if (!image) {
            return res.status(400).json({ message: "กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป" });
        }

        const review = await prisma.review.create({
            data: {
                userName,
                reviewProduct,
                reviewProductId: parseInt(reviewProductId),
                orderedId: parseInt(orderedId),
                asset_id: image.asset_id || '',
                public_id: image.public_id || '',
                url: image.url || '',
                secure_url: image.secure_url || ''
            },
        });
        res.status(201).json(review);
    } catch (err) {
        console.error("❌ Error saving review:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.readReview = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await prisma.review.findFirst({
            where: {
                orderedId: Number(id)
            }
        });
        res.status(201).json(review);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.updateReview = async (req, res) => {
    try {
        const { userName, reviewProduct, image } = req.body;

        if (!image) {
            return res.status(400).json({ message: "กรุณาอัปโหลดรูป" });
        }

        const existingReview = await prisma.review.findFirst({
            where: {
                orderedId: Number(req.params.id),
            },
        });

        if (!existingReview) {
            return res.status(404).json({ message: "ไม่พบรีวิวนี้" });
        }

        const review = await prisma.review.update({
            where: {
                id: existingReview.id,
            },
            data: {
                userName,
                reviewProduct,
                asset_id: image.asset_id || '',
                public_id: image.public_id || '',
                url: image.url || '',
                secure_url: image.secure_url || ''
            }
        });
        res.status(201).json(review);
    } catch (err) {
        console.log("❌ update error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
};

exports.listReview = async (req, res) => {
    try {
        const reviews = await prisma.review.findMany({
            orderBy: { createdAt: "desc" },
        });
        res.status(200).json(reviews);
    } catch (err) {
        console.error("❌ Error fetching reviews:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.removeReview = async (req, res) => {
    try {
        const { id } = req.params;
        const reviewToDelete = await prisma.review.findFirst({
            where: { id: Number(id) },
        });

        if (reviewToDelete?.public_id) {
            await cloudinary.uploader.destroy(reviewToDelete.public_id);
        }

        const deletedReview = await prisma.review.delete({
            where: { id: Number(id) },
        });

        res.status(200).json(deletedReview);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.toggleReviewEnabled = async (req, res) => {
    try {
        const { id } = req.params;
        const { enabled } = req.body;

        const review = await prisma.review.update({
            where: { id: Number(id) },
            data: { enabled: Boolean(enabled) },
        });

        res.status(200).json(review);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getEnabledReviews = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10; // ✅ รับจาก query param
        const reviews = await prisma.review.findMany({
            where: { enabled: true },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        res.status(200).json(reviews);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.createImages = async (req, res) => {
    try {
        const { image, userName, orderedId } = req.body;

        if (!image || typeof image !== 'string') {
            return res.status(400).json({ message: "รูปภาพต้องเป็น base64 string" });
        }

        const result = await cloudinary.uploader.upload(image, {
            public_id: `Ecom2024/review-${userName}-${orderedId}`,
            resource_type: 'auto',
            folder: 'Ecom2024',
            overwrite: true
        });

        res.send(result);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.removeImage = async (req, res) => {
    try {
        const { public_id } = req.body;
        cloudinary.uploader.destroy(public_id, () => {
            res.send('Remove Image Success!!!');
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};
