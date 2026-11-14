const router = require("express").Router();
const passport = require("passport");
//const connection = require("../config/database");
//const User = connection.models.User;
//const pool = require("../db/pool");
const bcrypt = require("bcryptjs");
const userController = require("../controllers/userController");
//const isAuth = require("./authMiddleware").isAuth;
//const isAdmin = require("./authMiddleware").isAdmin;
//const isMember = require("./authMiddleware").isMember;
const prisma = require("../lib/prisma.js");

/**
 * -------------- POST ROUTES ----------------
 */

router.get("/", (req, res) => {
  res.render("index");
});

router.get("/login", (req, res) => {
  res.render("login");
});

router.get("/sign-up", (req, res, next) => {
  res.render("sign-up", { success: false, fail: false, user: req.user });
});

router.post("/sign-up", userController.addUser);
/*
router.get("/sign-up", (req, res, next) => {
  res.render("sign-up", { success: false, fail: false, user: req.user });
});
*/
/*
router.post(
  "/log-in",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login-failed",
    failureMessage: true,
  }),
);
*/

router.post(
  "/log-in",
  (req, res, next) => {
    console.log("Login route reached");
    console.log("Request body:", req.body);
    next();
  },
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login-failed",
    failureMessage: true,
  }),
);

router.get("/login-failed", (req, res, next) => {
  res.render("login-failed");
});

module.exports = router;
