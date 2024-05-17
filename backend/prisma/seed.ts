import { Colors } from "@prisma/client";
import { clearDB } from "./db.cleanup";
import { prisma } from "./db.setup";

async function seedDb() {
  // Clear old values -- This is only useful if we are testing and modifying values
  console.log("Starting DB Seeding ");
  await clearDB();

  // Create Brand

  const skyPioneer = await prisma.brands.create({
    data: {
      name: "SKY_PIONEER",
    },
  });

  // Create Categories
  const assortment = await prisma.categories.create({
    data: {
      name: "ASSORTMENT",
    },
  });

  // Create Colors
  const colors = await prisma.colorStrings.createManyAndReturn({
    data: [
      { name: "RED" },
      { name: "BLUE" },
      { name: "GREEN" },
      { name: "PURPLE" },
      { name: "PINK" },
      { name: "WHITE" },
    ],
  });

  const effects = await prisma.effectStrings.createManyAndReturn({
    data: [{ name: "STROBES" }, { name: "CRACKLES" }],
  });

  // Create Products

  const prod1 = await prisma.product.create({
    data: {
      id: 1001,
      title: "Carnival Pack Assortment (S & S)",
      inStock: true,
      Categories: {
        connect: { id: assortment.id },
      },
      Brands: { connect: { id: skyPioneer.id } },
      package: [36, 1],
      casePrice: 229.99,
      effects: {
        connect: [{ id: effects[0].id }, { id: effects[1].id }],
      },
      ColorStrings: {
        connect: colors.map((color) => ({ id: color.id })),
      },
      description:
        "This is an amazing assortment with top notch effects in every single fuse. Get a prepackaged assortment and get on with the show now.",
      image: "/product-imgs/pro-id-1001.png",
    },
  });

  const prod2 = await prisma.product.create({
    data: {
      id: 1023,
      title: "Wise Guy Assortment Box",
      inStock: true,
      Categories: {
        connect: { id: assortment.id },
      },
      Brands: {
        connectOrCreate: {
          where: {
            name: "WISE_GUY",
          },
          create: { name: "WISE_GUY" },
        },
      },
      package: [36, 1],
      casePrice: 229.99,
      effects: {
        connect: [{ id: effects[0].id }, { id: effects[1].id }],
      },
      ColorStrings: {
        connect: colors.map((color) => ({ id: color.id })),
      },
      description:
        "This is an amazing assortment with top notch effects in every single fuse. Get a prepackaged assortment and get on with the show now.",
      image: "/product-imgs/pro-id-1001.png",
    },
  });
}

//

seedDb()
  .then(() => {
    console.log("Seeding Complete");
  })
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
