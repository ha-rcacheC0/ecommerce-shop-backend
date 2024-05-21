import { Router } from "express";
const indexRouter = Router();

/* GET home page. */
indexRouter.get("/", function (req, res, next) {
  res.send({ message: "Express" });
});

export { indexRouter };
