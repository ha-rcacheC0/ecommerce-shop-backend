import { Router } from "express";
import { prisma } from "../../prisma/db.setup";
const adminRouter = Router();

/* GET home page. */
adminRouter.get("/inventory", async (req, res) => {
  const inventory = await prisma.unitProduct.findMany({
    include: {
      product: true,
    },
    orderBy: {
      productId: "asc",
    },
  });
  if (!inventory) {
    return res
      .status(200)
      .send({ messaage: "Either no items in inventory or no inventory found" });
  }
  return res.status(200).send(inventory);
});

export { adminRouter };
