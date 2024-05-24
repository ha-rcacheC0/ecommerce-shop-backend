import { Router } from "express";
const adminRouter = Router();

/* GET home page. */
adminRouter.get("/", function (req, res, next) {
  console.log(req.header("Authorization"));
  return res.render("admin", {
    title: "ADMINS ONLY",
    page: "admin-dash",
  });
});

export { adminRouter };
