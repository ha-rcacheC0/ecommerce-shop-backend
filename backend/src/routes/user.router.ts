import { Request, Response, Router } from "express";
import { validateRequest } from "zod-express-middleware";
import { prisma } from "../../prisma/db.setup";
import bcrypt from "bcrypt";

import {
  encryptPassword,
  createUserJwtToken,
  createTokenUserInfo,
  authenticationMiddleware,
} from "../utils/auth-utils";

const userRouter = Router();

userRouter.get("/", (req: Request, res: Response) => {
  res.render("index", {
    title: "Login",
    page: "login",
    messages: [],
  });
});

export { userRouter };
