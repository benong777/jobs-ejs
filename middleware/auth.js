//-- Middleware
//   Check if user exists (if the user is logged-in) and use that to determine if
//   the non-logged-in requester should be redirected to the home page, or
//   if the logged-in user should be allowed to continue to the next middleware or controller handler function.
const authMiddleware = (req, res, next) => {
  if (!req.user) {
    req.flash("error", "You can't access that page before logon.");
    res.redirect("/");
  } else {
    next();
  }
};

module.exports = authMiddleware;