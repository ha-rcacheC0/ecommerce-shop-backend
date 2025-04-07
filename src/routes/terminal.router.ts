import { Router } from "express";
import { prisma } from "../../prisma/db.setup";
import { State } from "@prisma/client";

const terminalRouter = Router();

terminalRouter.get("/", async (req, res) => {
  const { state, zipcode } = req.query;

  const query: any = {
    where: {
      address: {},
    },
    include: {
      address: true,
    },
  };

  if (state && typeof state === "string") {
    query.where.address.state = state as State;
  }

  if (zipcode && typeof zipcode === "string") {
    query.where.address.postalCode = {
      contains: zipcode,
    };
  }

  try {
    const terminals = await prisma.approvedTerminals.findMany(query);
    return res.json(terminals);
  } catch (error) {
    return res.status(500).json({ error: "Error fetching terminals" });
  }
});

terminalRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const terminal = await prisma.approvedTerminals.findFirst({
      where: {
        id: id,
      },
      include: {
        address: true,
      },
    });
    return res.status(200).send(terminal);
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Error finding the terminal : ${error}` });
  }
});
export { terminalRouter };
