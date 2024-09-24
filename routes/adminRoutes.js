const express = require("express");

const router = express.Router();

router.get("/", (req, res)=>{
    res.render("admin")
})
.get("/addItem", (req, res) => {
    res.render("addStock")
})

module.exports = router;