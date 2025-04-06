import { prisma } from "./db.setup";

async function main() {
  const environment = process.env.NODE_ENV || "development";
  console.log(`Seeding database for environment: ${environment}`);

  // Create base categories
  const categories = [
    "REPEATERS_200_GRAM",
    "REPEATERS_500_GRAM",
    "ASSORTMENT",
    "BOTTLE_ROCKETS",
    "CONE_FLORAL",
    "CONFETTI_SHOOTERS_AIR_COMPRESSED",
    "FIRECRACKERS",
    "FLYING_HELICOPTERS",
    "FOUNTAINS",
    "FUSE",
    "GENDER_REVEAL",
    "GROUND",
    "PARACHUTES",
    "PINWHEELS",
    "RELOADABLES",
    "ROCKETS_MISSLES",
    "ROMAN_CANDLES",
    "SHELLS_MINES",
    "SNAKE_SMOKE",
    "SPARKLERS",
    "SUPPLIES_VISIBILITY",
    "TOY_NOVELTIES_STROBES",
    "TUBES",
  ];

  const effects = [
    "BROCAD",
    "CHRYSANTHEMUM",
    "COMET",
    "CONFETTI",
    "CRACKLES",
    "CROSSETTE",
    "FAN_EFFECTS",
    "FLYING_FISH",
    "GLITTER",
    "GLOW",
    "HELICOPTER",
    "LOUD_BANG",
    "NISHIKI_KAMURO",
    "PALM_TREE",
    "PARACHUTE",
    "PEARLS",
    "PEONY",
    "PISTIL",
    "REVEAL",
    "RISING_TAIL",
    "SIZZLES",
    "SMOKE",
    "SNAKE",
    "SNAPS",
    "SPARKLES",
    "SPINS",
    "STROBES",
    "TOURBILLION",
    "WATERFALL",
    "WHISTLE",
    "WILLOW",
  ];

  const colors = [
    "BLACK",
    "BLUE",
    "BROWN",
    "GOLD",
    "GREEN",
    "ORANGE",
    "PINK",
    "PURPLE",
    "RED",
    "SILVER",
    "WHITE",
    "YELLOW",
  ];

  const brands = [
    "ALPHA_FIREWORKS",
    "BLACK_SCORPION",
    "BLUE_DRAGON",
    "BOOM_WOW",
    "BOOMER",
    "BROTHERS",
    "BUM_BUM",
    "CRZ",
    "CSS",
    "DFS",
    "DEMON_PYRO",
    "DOMINATOR",
    "DUCK",
    "FIREHAWK",
    "FISHERMAN",
    "FOX_FIREWORKS",
    "GALAXY_FIREWORKS",
    "GENERIC",
    "HAPPY_FAMILY",
    "HOP_KEE",
    "IRONMAN",
    "KRIPTON_FIREWORKS",
    "LEGEND",
    "MAD_OX",
    "MC_FIREWORKS",
    "MIGHTY_MAX",
    "MIRACLE",
    "MUSCLE_PACK",
    "PYRO_DIABLO",
    "PYRO_MOOI",
    "PYRO_PIRATE",
    "RACCOON",
    "RED_LANTERN",
    "SHOGUN",
    "SIN_CITY",
    "SKY_EAGLE",
    "SKY_SLAM",
    "SKY_PAINTER",
    "SKY_PIONEER",
    "STARGET",
    "SUNS_FIREWORKS",
    "T_SKY",
    "TOPGUN",
    "WINDA",
    "WISE_GUY",
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  for (const name of brands) {
    await prisma.brand.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  for (const name of colors) {
    await prisma.color.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  for (const name of effects) {
    await prisma.effect.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  if (environment === "development") {
    // Getting references to categories and brands
    const assortment = await prisma.category.findUnique({
      where: { name: "ASSORTMENT" },
    });
    const winda = await prisma.brand.findUnique({ where: { name: "WINDA" } });

    if (assortment && winda) {
      // Create a test product
      await prisma.product.upsert({
        where: { sku: 1041 },
        update: {},
        create: {
          sku: 1041,
          title: "Container Load Blue",
          inStock: true,
          categoryId: assortment.id,
          brandId: winda.id,
          package: [1, 4],
          casePrice: 184.99,
          description: "This is a test product for development",
          image: "/product-imgs/pro-id-1001.png",
          isCaseBreakable: false,
        },
      });
    }
  }

  console.log(`Database has been seeded for ${environment} environment`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
