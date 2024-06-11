import { Router } from "express";
import { validateRequest } from "zod-express-middleware";
import { prisma } from "../../prisma/db.setup";
import bcrypt from "bcrypt";

import {
  encryptPassword,
  createUserJwtToken,
  createTokenUserInfo,
  authenticationMiddleware,
} from "../utils/auth-utils";
import { z } from "zod";

const userRouter = Router();

userRouter.post(
  "/register",
  validateRequest({
    body: z
      .object({
        email: z.string().email(),
        password: z.string(),
      })
      .strict(),
  }),
  async (req, res) => {
    const { email, password } = req.body;

    try {
      const user = await prisma.user.create({
        data: {
          email,
          hashedPassword: await encryptPassword(password),
          profiles: {
            create: {},
          },
          Cart: {
            create: {},
          },
        },
        include: {
          Cart: true,
        },
      });

      if (!user) {
        return res
          .status(500)
          .send({ message: "Something went wrong. User was not created" });
      }

      return res.status(201).send(user);
    } catch (error) {
      console.error("Error creating user:", error);
      return res
        .status(500)
        .send({ message: "Something went wrong. User was not created" });
    }
  }
);

userRouter.post(
  "/login",
  validateRequest({
    body: z.object({
      email: z.string(),
      password: z.string(),
    }),
  }),
  async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findFirst({
      where: {
        email: email,
      },
      include: {
        Cart: {
          include: {
            products: {
              include: {
                Brands: true,
                Categories: true,
                ColorStrings: true,
                effects: true,
              },
            },
            User: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).send({ message: "User Not Found" });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.hashedPassword
    );
    if (!isPasswordCorrect) {
      return res
        .status(401)
        .send({ message: "Invalid Credentials, please try again" });
    }

    await prisma.user.update({
      data: {
        lastLogin: new Date().toISOString(),
      },
      where: {
        id: user.id,
      },
    });

    const userInfo = createTokenUserInfo(user);
    const token = createUserJwtToken(user);
    console.log("this went fine", { token, userInfo });

    return res.status(200).send({ token, userInfo });
  }
);
userRouter.get("/userInfo", authenticationMiddleware, async (req, res) => {
  const { id } = req.user!;
  const user = await prisma.userProfile.findFirst({
    where: {
      userId: id,
    },
  });
  if (!user)
    return res.status(400).send({ message: "User Profile was not found" });
  return res.status(200).send(user);
});

export { userRouter };
