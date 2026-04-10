const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
require('dotenv').config()

const {connectMongoDb} = require("./connection")
const router = require("./routes/routes");
const staticRouter = require("./routes/staticRoutes")
const buyRouter = require("./routes/buyroutes");
const admRouter = require("./routes/adminRoutes")
const imageRouter = require("./routes/imageRoutes");

const {
    restrictToUserLogin,
    restrictToUserAdmin
} = require("./middleware/auth")

const app = express();

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

connectMongoDb(process.env.MNG_URL);

app.use("/data", restrictToUserAdmin, router);
app.use("/", staticRouter);
app.use("/buy", restrictToUserLogin, buyRouter);
app.use("/adm", restrictToUserAdmin, admRouter);
app.use("/img", imageRouter);

app.listen(process.env.PORT, () => {
    console.log("Server Started")
});
