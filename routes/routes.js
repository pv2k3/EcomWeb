const express = require("express");
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
        cb(null, `${file.originalname}`)
    }
})

const upload = multer({storage});

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