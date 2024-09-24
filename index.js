const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
require('dotenv').config()


const {connectMongoDb} = require("./connection")
const router = require("./routes/routes");
const staticRouter = require("./routes/staticRoutes")
const buyRouter = require("./routes/buyroutes");
const admRouter = require("./routes/adminRoutes")
const {
    restrictToUserLogin,
    restrictToUserAdmin
} = require("./middleware/auth")

const app = express();


app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));
app.use(cookieParser())
app.use(express.static(__dirname))
app.use(express.urlencoded({extended: false}))


connectMongoDb(process.env.MNG_URL);

app.use("/data", restrictToUserAdmin, router);
app.use("/", staticRouter);
app.use("/buy", restrictToUserLogin, buyRouter);
app.use("/adm", restrictToUserAdmin, admRouter);

app.listen(process.env.PORT, ()=>{
    console.log("Server Started")
})