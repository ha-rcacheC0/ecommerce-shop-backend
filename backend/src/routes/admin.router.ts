import { Router } from "express";
const adminRouter = Router();

/* GET home page. */
adminRouter.get("/", function (req, res, next) {
  res.render("index", { title: "ADMINS ONLY" });
});

export { adminRouter };
