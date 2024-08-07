import express from "express";
import cors from "cors";
import { User } from "@prisma/client";
import { adminRouter } from "./routes/admin.router";
import { productRouter } from "./routes/product.router";
import { purchaseRouter } from "./routes/purchase.router";
import { configDotenv } from "dotenv";
import path from "path";
import { userRouter } from "./routes/user.router";

import session from "express-session";

import { cartRouter } from "./routes/cart.router";
import { terminalRouter } from "./routes/terminal.router";

configDotenv();

const app = express();
app.use(cors());
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
app.use(
  session({
    secret: process.env.SESSION_SECRET || "SECRET_MISSING",
    saveUninitialized: false,
    resave: false,
  })
);

const port = normalizePort(process.env.PORT || "3000");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up Routes as needed

app.use("/user", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/purchase", purchaseRouter);
app.use("/products", productRouter);
app.use("/cart", cartRouter);
app.use("/api/terminal", terminalRouter);

app.listen(port, () => {
  if (process.env.NODE_ENV === "development") {
    console.log(`Listening on http://localhost:${port} `);
  }
});

function normalizePort(val: string): string | number | false {
  let port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}
