const prisma = require('../config/prisma')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')


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
