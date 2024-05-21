import express from "express";
import cors from "cors";
import { User } from "@prisma/client";
import { adminRouter } from "./routes/admin";
import { productRouter } from "./routes/product";
import { configDotenv } from "dotenv";
import path from "path";
import { userRouter } from "./routes/user.router";

configDotenv();

const app = express();
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const port = normalizePort(process.env.PORT || "3000");
app.use(express.json());
app.use(cors());
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "../../frontend")));
app.set("view engine", "ejs");

// Set up Routes as needed

app.get("/", (req, res) => {
  res.send("Hello World");
});
app.use("/user", userRouter);
app.use("/admin", adminRouter);
app.use("/products", productRouter);

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
