const prisma = require("../config/prisma")

exports.postcontactus = async (req, res) => {
    const { name, email, subject, message } = req.body;
    try {
        const contact = await prisma.contact.create({
            data: { name, email, subject, message },
        });
        res.status(201).json(contact);
    } catch (error) {
        console.error("❌ Error saving contact:", error);
        res.status(500).json({ message: "Server error" });
    }
}

exports.listcontactus = async (req, res) => {
    try {
        const contacts = await prisma.contact.findMany({
            orderBy: { createdAt: "desc" },
        });
        res.status(200).json(contacts);
    } catch (err) {
        console.error("❌ Error fetching contacts:", err);
        res.status(500).json({ message: "Server Error" });
    }
}

exports.removecontactus = async (req, res) => {
    try {
        // code
        const { id } = req.params
        const contact = await prisma.contact.delete({
            where: {
                id: Number(id)
            }
        })
        // res.send(contact)
        res.status(200).json(contact);
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server error" })
    }
}