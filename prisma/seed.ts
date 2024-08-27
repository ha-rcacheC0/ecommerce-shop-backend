import { Brand, Category, Colors, Effects } from "@prisma/client";
import { prisma } from "./db.setup";
import { calcUnitPrice } from "../src/utils/creation-utils";

const getEnumValues = (enumObj: any) => {
  return Object.keys(enumObj).map((enumVal) => ({
    name: enumObj[enumVal],
  }));
};

async function createProducts() {
  await prisma.unitProduct.deleteMany();
  await prisma.product.deleteMany();

  const prod1 = await prisma.product.create({
    data: {
      sku: 1041,
      title: "Container Load Blue",
      inStock: true,
      Categories: {
        connect: { name: "ASSORTMENT" },
      },
      Brands: {
        connect: { name: "WINDA" },
      },
      package: [1, 4],
      casePrice: 184.99,
      EffectStrings: {
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
      videoURL: "https://www.youtube.com/watch?v=Mk1oUvHlJCM",
      isCaseBreakable: false,
    },
  });

  const prod2 = await prisma.product.create({
    data: {
      sku: 1023,
      title: "Wise Guy Assortment Box",
      inStock: false,
      Categories: {
        connect: { name: "ASSORTMENT" },
      },
      Brands: {
        connect: {
          name: "WISE_GUY",
        },
      },
      package: [4, 1],
      casePrice: 229.99,
      EffectStrings: {
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
      videoURL: "https://www.youtube.com/watch?v=8Fe2-y-MQzs",
      isCaseBreakable: false,
      UnitProduct: {
        create: {
          sku: "1023-u",
          availableStock: 0,
          unitPrice: calcUnitPrice(229.99, 4),
          package: [1, 1],
        },
      },
    },
    include: { UnitProduct: true },
  });
  const prod3 = await prisma.product.create({
    data: {
      sku: 1044,
      title: "Most Wanted",
      image: "/product-imgs/pro-id-1044.jpeg",
      casePrice: 154.99,
      inStock: true,
      package: [1, 1],
      Categories: {
        connect: { name: "ASSORTMENT" },
      },
      Brands: {
        connect: {
          name: "TOPGUN",
        },
      },
      videoURL: "https://www.youtube.com/watch?v=FpXuD2E1O8E",
    },
  });
  const prod4 = await prisma.product.create({
    data: {
      sku: 1049,
      title: "League of Legends #5",
      image: "/product-imgs/pro-id-1049.jpeg",
      casePrice: 149.99,
      inStock: true,
      package: [2, 1],
      Categories: {
        connect: { name: "ASSORTMENT" },
      },
      Brands: {
        connect: {
          name: "LEGEND",
        },
      },
      UnitProduct: {
        create: {
          sku: "1049-u",
          unitPrice: calcUnitPrice(149.99, 2),
          package: [1, 1],
          availableStock: 0,
        },
      },
    },
    include: { UnitProduct: true },
  });
  const prod5 = await prisma.product.create({
    data: {
      sku: 1047,
      title: "Kids Assortment Car (S & S)",
      image: "/product-imgs/pro-id-1047.jpeg",
      casePrice: 84.99,
      inStock: true,
      package: [8, 1],
      Categories: {
        connect: { name: "ASSORTMENT" },
      },
      Brands: {
        connect: {
          name: "STARGET",
        },
      },
      UnitProduct: {
        create: {
          sku: "1047-u",
          unitPrice: calcUnitPrice(84.99, 8),
          availableStock: 0,
          package: [1, 1],
        },
      },
    },
    include: { UnitProduct: true },
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
  // createProducts();
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
