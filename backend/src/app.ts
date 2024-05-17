import express from "express";
import cors from "cors";
import { indexRouter } from "./routes/index";
import { configDotenv } from "dotenv";

configDotenv();

const app = express();

const port = normalizePort(process.env.PORT || "3000");
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World");
});
app.use("/home", indexRouter);

console.log(process.env.PORT);
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
