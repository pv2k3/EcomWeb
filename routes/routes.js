const express = require("express");
const path = require("path");
const crypto = require("crypto");
const {
    Laptop,
    Desktop,
    Accessory
} = require("../models/STOCK")
const User = require("../models/USER");

const multer = require("multer");
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, `public/uploads/${req.body.type}`)
    },
    filename: function(req, file, cb){
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${crypto.randomBytes(8).toString('hex')}${ext}`);
    }
})

const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
    }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

const {
    getItemDetails,
    addItemInDB
} = require("../controller/controllers")

const router = express.Router();

router.get("/userRecord", async (req, res) => {
    try {
        const allUsers = await User.find();
        res.status(200).json(allUsers);
    } catch (error) {
        res.status(500).json({error: error.message})
    }
})

router.route("/products")
.get(async (req, res)=>{
    getItemDetails(req, res);
})
.post(upload.single('image'), async (req, res) => {
    addItemInDB(req, res);
})


module.exports = router;