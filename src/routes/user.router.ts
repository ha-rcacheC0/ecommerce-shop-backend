import { Router } from "express";
import { validateRequest } from "zod-express-middleware";
import { prisma } from "../../prisma/db.setup";
import bcrypt from "bcrypt";

import {
  encryptPassword,
  createUserJwtToken,
  createTokenUserInfo,
  authenticationMiddleware,
  authenticationAdminMiddleware,
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
          profile: {
            create: {},
          },
          cart: {
            create: {},
          },
        },
        include: {
          cart: true,
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
        cart: {
          include: {
            cartProducts: {
              include: {
                product: {
                  include: {
                    brand: true,
                    category: true,
                    colors: true,
                    effects: true,
                  },
                },
              },
            },
            user: true,
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
    return res.status(200).send({ token, userInfo });
  }
);
userRouter.get("/userInfo", authenticationMiddleware, async (req, res) => {
  const { id } = req.user!;
  const user = await prisma.userProfile.findFirst({
    where: {
      userId: id,
    },
    include: {
      billingAddress: true,
      shippingAddress: true,
    },
  });
  if (!user)
    return res.status(400).send({ message: "User Profile was not found" });
  return res.status(200).send(user);
});

userRouter.post("/userInfo", authenticationMiddleware, async (req, res) => {
  const { id } = req.user!;

  const {
    firstName,
    lastName,
    dateOfBirth,
    phoneNumber,
    billingAddress,
    shippingAddress,
    canContact,
  } = req.body;

  try {
    // Construct the update data object conditionally
    const updateData: any = {};

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (canContact !== undefined) updateData.canContact = canContact;

    if (billingAddress) {
      updateData.billingAddress = {
        upsert: {
          create: {
            street1: billingAddress.street1,
            street2: billingAddress.street2,
            city: billingAddress.city,
            postalCode: billingAddress.postalCode,
            state: billingAddress.state,
          },
          update: {
            street1: billingAddress.street1,
            street2: billingAddress.street2,
            city: billingAddress.city,
            postalCode: billingAddress.postalCode,
            state: billingAddress.state,
          },
        },
      };
    }

    if (shippingAddress) {
      updateData.shippingAddress = {
        upsert: {
          create: {
            street1: shippingAddress.street1,
            street2: shippingAddress.street2,
            city: shippingAddress.city,
            postalCode: shippingAddress.postalCode,
            state: shippingAddress.state,
          },
          update: {
            street1: shippingAddress.street1,
            street2: shippingAddress.street2,
            city: shippingAddress.city,
            postalCode: shippingAddress.postalCode,
            state: shippingAddress.state,
          },
        },
      };
    }

    const updatedUserInfo = await prisma.userProfile.update({
      where: {
        userId: id,
      },
      data: updateData,
    });

    if (!updatedUserInfo)
      return res.status(400).send({ message: "Unable to update userInfo" });

    return res.status(201).send(updatedUserInfo);
  } catch (error) {
    return res.status(500).send({ message: "Internal Server Error" });
  }
});

userRouter.get("/getAll", authenticationAdminMiddleware, async (req, res) => {
  const allUsers = await prisma.user.findMany({
    include: {
      profile: true,
    },
  });
  if (!allUsers) res.status(500).send({ message: "Internal Server Error" });

  return res.status(200).send(allUsers);
});

export { userRouter };
