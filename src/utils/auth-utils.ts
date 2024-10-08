import { Cart, User } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { z } from "zod";
import { NextFunction, Request, Response } from "express";
import { prisma } from "../../prisma/db.setup";

import dotenv from "dotenv";
dotenv.config();

const saltRounds = 12;

export const encryptPassword = (password: string) => {
  return bcrypt.hash(password, saltRounds);
};

type UserWithCart = {
  Cart: {
    id: string;
    userId: string | null;
  } | null;
  id: string;
  role: string;
  email: string;
  hashedPassword: string;
  createdOn: Date | null;
  lastLogin: Date | null;
};

export const createTokenUserInfo = (user: UserWithCart) => {
  return {
    email: user.email,
    role: user.role,
    lastLogin: user.lastLogin,
    Cart: user.Cart,
  };
};

const jwtInfoSchema = z.object({
  email: z.string().email(),
  role: z.string(),
  iat: z.number(),
  exp: z.number(),
});

export const createUserJwtToken = (user: UserWithCart) => {
  const expiresIn = "24h";
  return jwt.sign(createTokenUserInfo(user), process.env.JWT_SECRET!, {
    expiresIn,
  });
};

export const getDataFromAuthToken = (token?: string) => {
  if (!token) return null;
  try {
    return jwtInfoSchema.parse(jwt.verify(token, process.env.JWT_SECRET!));
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const authenticationMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const [, token] = req.headers.authorization?.split?.(" ") || [];
  const userJWTData = getDataFromAuthToken(token);
  if (!userJWTData) return res.status(401).send({ message: "Invalid token" });

  const user = await prisma.user.findFirst({
    where: {
      email: userJWTData.email,
    },
  });
  if (!user) return res.status(401).send({ message: "User not Found" });

  req.user = user;
  next();
};
export const authenticationAdminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const [, token] = req.headers.authorization?.split?.(" ") || [];
  const userJWTData = getDataFromAuthToken(token);
  if (!userJWTData) return res.status(401).send({ message: "Invalid token" });
  if (userJWTData.role === "USER")
    return res.status(401).send({ message: "Users are not allowed here" });
  const user = await prisma.user.findFirst({
    where: {
      email: userJWTData.email,
    },
  });
  if (!user) return res.status(401).send({ message: "User not Found" });

  req.user = user;
  next();
};
