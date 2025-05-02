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
app.use(cors());

// Set up Routes as needed
app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/purchase", purchaseRouter);
app.use("/api/metadata", metadataRouter);
app.use("/api/products", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/terminal", terminalRouter);
app.use("/api/shows", showsRouter);

// Add static file serving for the frontend
app.use(express.static(path.join(__dirname, "../public")));

// This handles SPA routing - serve index.html for all non-API routes
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api/")) {
    res.sendFile(path.join(__dirname, "../public/index.html"));
  }
});

// Listen on all interfaces with port as a number
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port} and listening on all interfaces`);
});
