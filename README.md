# file-uploader

Google Drive clone that allows users to store and share files online. Built using Express, PassportJS and Prisma ORM.

Self note:

1.  Continue using pool for session. Create a separate lib/pool.js file to use pool. No need to use Prisma to configure sessions.
2.  pool.query returns an object have one of it's keys as 'rows' which holds an array of objects. Each object for each row. Prisma.user.findUnique() return an object directly that represens the row.
3.  There are two ways to use passport.authenticate:
    i.
    passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login-failed",
    failureMessage: true,
    })
    ii.
    passport.authenticate("local", (err, user, info) => {
    if (err) {
    return next(err);
    }

    if (!user) {
    console.log(info.message);
    return res.redirect("/login-failed");
    }

    req.logIn(user, (err) => {
    if (err) return next(err);

          return res.redirect("/");

    });
    })(req, res, next);
    First one is the easier one, but you'll only be able to redirect to a page and you cannot pass any parameters. In the second one you can define the callback but it's little difficult to understand.
