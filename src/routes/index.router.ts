import { Router } from "express";

const indexRouter = Router();

indexRouter.get("/", (req, res) => {
  res.render("index", {
    title: "Crew Fireworks",
    page: "home",

    messages: req.flash("loginMessage"),
  });
});

indexRouter.get("/privacy-policy", (req, res) => {
  res.render("index", {
    title: "Crew Fireworks",
    page: "privacy-policy",

    messages: req.flash("loginMessage"),
  });
});

export { indexRouter };
