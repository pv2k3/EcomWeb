const express = require("express");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const { getUser } = require("../services/auth");
const User = require("../models/USER");
const { Laptop, Desktop, Accessory } = require("../models/STOCK");
const getAllRecords = require("../controller/helper");
const { ObjectId } = require("mongodb");

const router = express.Router();

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, `public/uploads/${req.body.type}`);
    },
    filename: function(req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${crypto.randomBytes(8).toString('hex')}${ext}`);
    }
});
const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only JPEG, PNG, WebP allowed'), false);
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

async function getAdminStats() {
    const allUsers = await User.find({}, { itemsBought: 1 });
    let itemsSold = 0, amountSales = 0, totalOrders = 0;
    allUsers.forEach(u => {
        u.itemsBought.forEach(r => {
            totalOrders++;
            itemsSold += r.qty;
            amountSales += r.price * r.qty;
        });
    });
    return { userCount: allUsers.length, itemsSold, amountSales, totalOrders };
}

// Dashboard
router.get("/", async (req, res) => {
    const user = req.user;
    const name = await User.findById(user.id, { userName: 1, _id: 0 });
    const stats = await getAdminStats();
    const activeUser = (await User.find({ isLoggedIn: true })).length;
    const allItems = await getAllRecords();
    res.render("admin", {
        name,
        userCount: stats.userCount,
        itemsSold: stats.itemsSold,
        activeUser,
        salesAmount: stats.amountSales,
        totalOrders: stats.totalOrders,
        allItems
    });
});

// Products list (for sidebar navigation)
router.get("/products", async (req, res) => {
    const allItems = await getAllRecords();
    const user = req.user;
    const name = await User.findById(user.id, { userName: 1, _id: 0 });
    res.render("adminProducts", { allItems, name });
});

// Add item form
router.get("/products/add", (req, res) => {
    res.render("addStock");
});

// Add item POST (multer handles upload)
router.post("/products/add", upload.single("image"), async (req, res) => {
    const Image = require("../models/IMAGES");
    const fs = require("fs");
    const body = req.body;
    const type = body.type;
    const file = req.file;
    if (!body.productName || !body.category || !body.qty || !body.price || !file) {
        return res.redirect("/adm/products/add");
    }
    const imageBuffer = await fs.promises.readFile(file.path);
    const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
    const image = await Image.create({
        name: `${type}_${body.productName}`,
        contentType: `image/${ext}`,
        image: imageBuffer
    });
    const nonTechInfo = { productName: body.productName, category: body.category, qty: body.qty, price: body.price, image: image._id };
    if (type === "laptop") {
        await Laptop.create({ ...nonTechInfo, specification: { processor: body.processor, ram: body.ram, storage: body.storage, battery: body.battery, graphicCard: body.graphicCard } });
    } else if (type === "desktop") {
        await Desktop.create({ ...nonTechInfo, specification: { processor: body.processor, ram: body.ram, storage: body.storage, battery: body.battery, graphicCard: body.graphicCard } });
    } else if (type === "accessory") {
        await Accessory.create({ ...nonTechInfo, description: body.description });
    }
    res.redirect("/adm/products");
});

// Edit product form
router.get("/products/edit/:type/:id", async (req, res) => {
    const { type, id } = req.params;
    let product;
    if (type === "laptop") product = await Laptop.findById(id);
    else if (type === "desktop") product = await Desktop.findById(id);
    else if (type === "accessory") product = await Accessory.findById(id);
    if (!product) return res.redirect("/adm/products");
    res.render("adminProductEdit", { product, type });
});

// Edit product POST
router.post("/products/edit/:type/:id", async (req, res) => {
    const { type, id } = req.params;
    const body = req.body;
    const update = { productName: body.productName, category: body.category, qty: Number(body.qty), price: Number(body.price) };
    if (type === "laptop" || type === "desktop") {
        update.specification = { processor: body.processor, ram: body.ram, storage: body.storage, battery: body.battery, graphicCard: body.graphicCard };
        if (type === "laptop") await Laptop.findByIdAndUpdate(id, update);
        else await Desktop.findByIdAndUpdate(id, update);
    } else if (type === "accessory") {
        update.description = body.description;
        await Accessory.findByIdAndUpdate(id, update);
    }
    res.redirect("/adm/products");
});

// Delete product
router.post("/products/delete/:type/:id", async (req, res) => {
    const { type, id } = req.params;
    if (type === "laptop") await Laptop.findByIdAndDelete(id);
    else if (type === "desktop") await Desktop.findByIdAndDelete(id);
    else if (type === "accessory") await Accessory.findByIdAndDelete(id);
    res.redirect("/adm/products");
});

// Users table
router.get("/users", async (req, res) => {
    const users = await User.find({}, { password: 0, salt: 0 }).sort({ createdAt: -1 });
    const user = req.user;
    const name = await User.findById(user.id, { userName: 1, _id: 0 });
    res.render("adminUsers", { users, name });
});

// Toggle user role
router.post("/users/role/:id", async (req, res) => {
    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) return res.redirect("/adm/users");
    // Prevent demoting self
    if (userToUpdate._id.toString() === req.user.id) return res.redirect("/adm/users");
    const newRole = userToUpdate.role === "ADMIN" ? "NORMAL" : "ADMIN";
    await User.findByIdAndUpdate(req.params.id, { role: newRole });
    res.redirect("/adm/users");
});

// Orders table
router.get("/orders", async (req, res) => {
    const allUsers = await User.find({}, { userName: 1, email: 1, itemsBought: 1 });
    const orders = [];
    allUsers.forEach(u => {
        u.itemsBought.forEach(item => {
            orders.push({
                userName: u.userName,
                email: u.email,
                itemName: item.name,
                itemType: item.itemType,
                qty: item.qty,
                price: item.price,
                total: item.price * item.qty,
                image: item.image,
            });
        });
    });
    orders.reverse();
    const user = req.user;
    const name = await User.findById(user.id, { userName: 1, _id: 0 });
    res.render("adminOrders", { orders, name });
});

// Admin logout
router.post("/logout", async (req, res) => {
    const { ObjectId } = require("mongodb");
    await User.updateOne({ _id: new ObjectId(req.user.id) }, { isLoggedIn: false });
    res.clearCookie("uid").redirect("/account/login");
});

module.exports = router;
