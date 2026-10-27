const express = require("express");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const billRoutes = require("./routes/billRoutes");
const reminderRoutes = require("./routes/reminderRoutes");
const activityRoutes = require("./routes/activityRoutes");
const authRoutes = require("./routes/authRoutes");
const authMiddleware = require("./middleware/auth");
const helpRoutes = require("./routes/helpRoutes");
const notificationHelper = require("./utils/notificationHelper");

require("dotenv").config();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  }),
);

app.use((req, res, next) => {
  res.locals.user = req.session?.user || null;
  next();
});

app.use (async(req,res,next) => {
  res.locals.notifications =
  await notificationHelper.getNotifications();

  next();
})


app.use(express.static(path.join(__dirname, "public")));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(expressLayouts);

app.set("layout", "layouts/main");

const webRoute = require("./routes/web");

app.use("/", authRoutes);

app.use(authMiddleware);

app.use("/", webRoute);

app.use("/bills", billRoutes);

app.use("/reminder", reminderRoutes);

app.use("/activity", activityRoutes);

app.use("/help",helpRoutes);

module.exports = app;
