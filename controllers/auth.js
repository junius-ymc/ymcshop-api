const prisma = require('../config/prisma')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const nodemailer = require("nodemailer")

exports.register = async (req, res) => {
    try {
        //code
        const { email, password } = req.body

        // Step 1 Validate body
        if (!email) {
            return res.status(400).json({ message: 'Email is required !!!' })
        }
        if (!password) {
            return res.status(400).json({ message: "Password is required !!!" })
        }

        // Step 2 Check Email in DB already ?
        const user = await prisma.user.findFirst({
            where: {
                email: email
            }
        })
        if (user) {
            return res.status(400).json({ message: "Email already exits !!", msgnotif: '1' })
        }
        // Step 3 HashPassword
        const hashPassword = await bcrypt.hash(password, 10)

        // Step 4 Register
        await prisma.user.create({
            data: {
                email: email,
                password: hashPassword
            }
        })
        res.send('Register Success')
    } catch (err) {
        // err
        console.log(err)
        res.status(500).json({ message: "Server Error", msgnotif: '2' })
    }
}

exports.login = async (req, res) => {
    try {
        //code
        const { email, password } = req.body
        // Step 1 Check Email
        const user = await prisma.user.findFirst({
            where: {
                email: email
            }
        })
        if (!user || !user.enabled) {
            return res.status(400).json({ message: 'User not found or not Enabled', errrr: '1' })
        }
        // Step 2 Check password
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ message: 'Password Invalid !!!', errrr: '2' })
        }
        // ✅ อัปเดต updatedAt
        await prisma.user.update({
            where: { id: user.id },
            data: { updatedAt: new Date() },
        })
        // Step 3 Create Payload
        const payload = {
            id: user.id,
            email: user.email,
            name: user.name,
            address: user.address,
            role: user.role
        }
        // Step 4 Generate Token
        jwt.sign(payload, process.env.SECRET, { expiresIn: '1d' }, (err, token) => {
            if (err) {
                return res.status(500).json({ message: "Server Error" })
            }
            res.json({ payload, token })

        })
    } catch (err) {
        // err
        console.log(err)
        res.status(500).json({ message: "Server Error" })
    }
}

exports.currentUser = async (req, res) => {
    try {
        //code
        const user = await prisma.user.findFirst({
            where: { email: req.user.email },
            select: {
                id: true,
                email: true,
                name: true,
                address: true,
                role: true
            }
        })
        res.json({ user })
    } catch (err) {
        //err
        console.log(err)
        res.status(500).json({ message: 'Server Error' })
    }
}

// 1. ขอ reset password (ส่งอีเมล)
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
console.log(email);
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ message: "This email was not found." });

        const token = jwt.sign({ userId: user.id }, process.env.JWT_RESET_SECRET, {
            expiresIn: "5m",
        });

        const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Reset Password - YMC Shop",
            html: `<p>Click this link to reset your password:</p><a href="${resetLink}" target="_blank">${resetLink}</a>`,
        });

        res.json({ message: "Password reset link sent successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error !!!" });
    }
};

// 2. เปลี่ยนรหัสผ่านใหม่
exports.resetPassword = async (req, res) => {
    const { token, password } = req.body;
    try {
        const decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: decoded.userId },
            data: { password: hashedPassword },
        });

        res.json({ message: "Password reset successful." });
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: "Token is invalid or expired !!!" });
    }
};
