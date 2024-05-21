import express from "express";
import cors from "cors";
import { User } from "@prisma/client";
import { adminRouter } from "./routes/admin.router";
import { productRouter } from "./routes/product.router";
import { configDotenv } from "dotenv";
import path from "path";
import { userRouter } from "./routes/user.router";
import session from "express-session";
import flash from "connect-flash";

configDotenv();

const app = express();
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
app.use(flash());

const port = normalizePort(process.env.PORT || "3000");
app.use(express.json());
app.use(cors());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "../../frontend")));

// Set up Routes as needed

app.get("/", (req, res) => {
  res.send("Hello World");
});
app.use("/user", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/products", productRouter);

app.listen(port, () => {
  if (process.env.NODE_ENV === "development") {
    console.log(`Listening on localhost://${port} `);
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
