import { Brand, Category, Colors, Effects } from "@prisma/client";
import { prisma } from "./db.setup";

const getEnumValues = (enumObj: any) => {
  return Object.keys(enumObj).map((enumVal) => ({
    name: enumObj[enumVal],
  }));
};

async function createProducts() {
  // Create Products

  const prod1 = await prisma.product.create({
    data: {
      id: 1001,
      title: "Carnival Pack Assortment (S & S)",
      inStock: true,
      Categories: {
        connectOrCreate: {
          where: {
            name: "ASSORTMENT",
          },
          create: { name: "ASSORTMENT" },
        },
      },
      Brands: {
        connectOrCreate: {
          where: {
            name: "SKY_PIONEER",
          },
          create: { name: "SKY_PIONEER" },
        },
      },
      package: [36, 1],
      casePrice: 229.99,
      effects: {
        connect: [{ name: "STROBES" }, { name: "CRACKLES" }],
      },
      ColorStrings: {
        connect: [
          { name: "RED" },
          { name: "BLUE" },
          { name: "PURPLE" },
          { name: "PINK" },
        ],
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
        connect: { name: "ASSORTMENT" },
      },
      Brands: {
        connect: {
          name: "WISE_GUY",
        },
      },
      package: [36, 1],
      casePrice: 229.99,
      effects: {
        connect: [{ name: "STROBES" }, { name: "CRACKLES" }],
      },
      ColorStrings: {
        connect: [
          { name: "RED" },
          { name: "BLUE" },
          { name: "PURPLE" },
          { name: "PINK" },
        ],
      },
      description:
        "This is an amazing assortment with top notch effects in every single fuse. Get a prepackaged assortment and get on with the show now.",
      image: "/product-imgs/pro-id-1001.png",
    },
  });
}

async function seedDb() {
  console.log("Starting DB Seeding ");

  const brandsData = getEnumValues(Brand);
  const colorsData = getEnumValues(Colors);
  const categoriesData = getEnumValues(Category);
  const effectsData = getEnumValues(Effects);
  // Create Brand

  const brands = await prisma.brands.createMany({
    data: brandsData,
    skipDuplicates: true,
  });

  // Create Categories
  const categories = await prisma.categories.createMany({
    data: categoriesData,
    skipDuplicates: true,
  });

  // Create Colors
  const colors = await prisma.colorStrings.createMany({
    data: colorsData,
    skipDuplicates: true,
  });

  const effects = await prisma.effectStrings.createManyAndReturn({
    data: effectsData,
    skipDuplicates: true,
  });

  const productsInDB = await prisma.product.count();
  if (productsInDB === 0) {
    await createProducts();
  }
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
