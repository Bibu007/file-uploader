//const pool = require("../db/pool");
const bcrypt = require("bcryptjs");
//const isAuth = require("../routes/authMiddleware").isAuth;
//const isAdmin = require("../routes/authMiddleware").isAdmin;
//import { prisma } from "../lib/prisma.js";
const prisma = require("../lib/prisma.js");

const { body, validationResult, matchedData } = require("express-validator");

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/~`]).{8,}$/;

const lengthErr = "must be between 1 and 50 characters.";
const numErr = "must be a number";
const releaseErr = "must be a valid year between 1900 and 2026";
const stockErr = "must be between 1 and 150";

const validateUser = [
  body("username")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage(`Username ${lengthErr}`)
    .notEmpty()
    .withMessage("Username cannot be empty"),
  body("password")
    .matches(passwordRegex)
    .withMessage(
      "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character.",
    ),
];

exports.addUser = [
  validateUser,
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(400).render("sign-up", {
          errors: errors.array(),
          success: false,
          fail: false,
        });
      }
      const { username, password } = matchedData(req);
      // Check whether username already exists
      const result = await prisma.user.findUnique({
        where: { username: username },
      });

      console.log(result);

      if (result !== null) {
        return res.status(409).render("sign-up", {
          errors: [{ msg: "Username already exists" }],
          success: false,
          fail: false,
        });
      }

      if (req.body.confirm !== req.body.password) {
        return res.status(409).render("sign-up", {
          errors: [{ msg: "Passwords do not match" }],
          success: false,
          fail: false,
        });
      }

      let admin = false;

      if (req.body.admin) {
        admin = true;
      }

      const hashedPassword = await bcrypt.hash(req.body.password, 10);

      const user = await prisma.user.create({
        data: {
          username: req.body.username,
          password: hashedPassword,
        },
      });

      const folder = await prisma.folder.create({
        data: {
          name: req.body.username,
          user: {
            connect: {
              id: user.id,
            },
          },
        },
      });

      res.render("sign-up", { success: true, fail: false });
    } catch (error) {
      console.error(error);
      res.render("sign-up", { success: false, fail: true });
      next(error);
    }
  },
];
