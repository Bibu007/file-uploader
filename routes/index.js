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
const upload = require("../upload.js");
const fs = require("fs/promises");

/**
 * -------------- POST ROUTES ----------------
 */

router.get("/", async (req, res) => {
  //res.render("index", { user: req.user });
  console.log("user");
  console.log(req.user);
  if (req.user) {
    try {
      const folder = await prisma.folder.findFirst({
        where: {
          userId: req.user.id,
          parentId: null,
        },
      });

      if (!folder) {
        return next(new Error("Root folder not found"));
      }

      return res.redirect(`/home/${folder.id}`);
    } catch (error) {
      console.log(error);
    }
  } else {
    res.render("index", { user: null });
  }
});

router.get("/login", (req, res) => {
  res.render("login");
});
/*
router.get("/home", (req, res) => {
  res.render("home");
});
*/

router.get("/home", async (req, res) => {
  //res.render("index", { user: req.user });
  if (req.user) {
    try {
      const folder = await prisma.folder.findFirst({
        where: {
          userId: user.id,
          parentId: null,
        },
      });

      if (!folder) {
        return next(new Error("Root folder not found"));
      }

      return res.redirect(`/home/${folder.id}`);
    } catch (error) {
      return next(error);
    }
  } else {
    res.render("index", { user: null });
  }
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
/*
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
*/
router.post(
  "/log-in",
  (req, res, next) => {
    console.log("Login route reached");
    console.log("Request body:", req.body);
    next();
  },
  (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.redirect("/login-failed");
      }

      // Manually establish the login session
      req.logIn(user, async (err) => {
        if (err) {
          return next(err);
        }

        try {
          const folder = await prisma.folder.findFirst({
            where: {
              userId: user.id,
              parentId: null,
            },
          });

          if (!folder) {
            return next(new Error("Root folder not found"));
          }

          return res.redirect(`/home/${folder.id}`);
        } catch (error) {
          return next(error);
        }
      });

      // Successful login
      //return res.redirect(`/home/${folder.id}`);
    })(req, res, next);
  },
);

router.get("/login-failed", (req, res, next) => {
  res.render("login-failed");
});

router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }

    res.redirect("/login");
  });
});

router.get("/home/:id", async (req, res, next) => {
  const folder = await prisma.folder.findUnique({
    where: {
      id: Number(req.params.id),
    },
    include: {
      files: true,
      children: true,
    },
  });

  if (folder.userId !== req.user.id) {
    return res
      .status(401)
      .json({ msg: "You are not authorized to view this resource" });
  }

  console.log(folder);

  let parent = null;

  if (folder.parentId) {
    parent = await prisma.folder.findUnique({
      where: {
        id: folder.parentId,
      },
    });
    //parentName = parent.name;
  }

  res.render("home", { folder: folder, user: req.user, parent });
});

router.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    const file = req.file;
    console.log(req.body);
    console.log(file);
    await prisma.file.create({
      data: {
        originalName: file.originalname,
        storedName: req.body.name,
        size: file.size,
        mimeType: file.mimetype,
        storagePath: file.path,
        folderId: Number(req.body.folderId),
        userId: req.user.id,
      },
    });

    res.redirect(`/home/${req.body.folderId}`);
  } catch (err) {
    next(err);
  }
});

router.get("/download/:id", async (req, res, next) => {
  try {
    const file = await prisma.file.findUnique({
      where: {
        id: Number(req.params.id),
      },
    });

    if (!file) {
      return res.status(404).send("File not found");
    }

    res.download(file.storagePath, file.storedName);
  } catch (err) {
    next(err);
  }
});

router.get("/delete/:folderId/:id", async (req, res, next) => {
  try {
    const file = await prisma.file.findUnique({
      where: {
        id: Number(req.params.id),
      },
    });

    if (!file) {
      return res.status(404).send("File not found");
    }

    await fs.unlink(file.storagePath);

    await prisma.file.delete({
      where: {
        id: file.id,
      },
    });

    res.redirect(`/home/${req.params.folderId}`);
  } catch (err) {
    next(err);
  }
});

router.post("/create", async (req, res, next) => {
  try {
    const folder = await prisma.folder.create({
      data: {
        name: req.body.name,
        userId: req.user.id,
        parentId: Number(req.body.parent),
      },
    });

    console.log("Folder");
    console.log(req.body);

    res.redirect(`/home/${folder.id}`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
