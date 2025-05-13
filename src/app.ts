import express from "express";
import cors from "cors";
import { User } from "@prisma/client";
import { adminRouter } from "./routes/admin.router";
import { productRouter } from "./routes/product.router";
import { purchaseRouter } from "./routes/purchase.router";
import { userRouter } from "./routes/user.router";
import { cartRouter } from "./routes/cart.router";
import { terminalRouter } from "./routes/terminal.router";
import { metadataRouter } from "./routes/metadata.router";
import { showsRouter } from "./routes/shows.router";
import path from "path";
import { reportsRouter } from "./routes/reports.router";

const app = express();
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const port = parseInt(process.env.PORT || "3000", 10);
app.use(express.json());
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "https://crew-fireworks.fly.dev",
        "https://crewfireworks.com",
        "https://www.crewfireworks.com",
        "http://localhost:5173",
      ];

      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Set up Routes as needed
app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/purchase", purchaseRouter);
app.use("/api/metadata", metadataRouter);
app.use("/api/products", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/terminal", terminalRouter);
app.use("/api/shows", showsRouter);
app.use("/api/reports", reportsRouter);

// Add static file serving for the frontend
app.use(express.static(path.join(__dirname, "../public")));

// Listen on all interfaces with port as a number
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port} and listening on all interfaces`);
});
