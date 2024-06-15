import { Router } from "express";
const adminRouter = Router();

/* GET home page. */
adminRouter.get("/", function (req, res, next) {
  res.status(400).send({ message: "come back later" });
});

export { adminRouter };
