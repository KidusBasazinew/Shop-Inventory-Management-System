import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@platform.local").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";

  // Sentinel platform shop groups the ADMIN accounts (User.shopId is
  // required). Excluded from all shop lists via name != "__platform__".
  let platform = await prisma.shop.findFirst({ where: { name: "__platform__" } });
  if (!platform) {
    platform = await prisma.shop.create({ data: { name: "__platform__", ownerName: "Platform" } });
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const existingAdmin = await prisma.user.findFirst({
    where: { email: adminEmail, role: "ADMIN" },
  });
  if (existingAdmin) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: { passwordHash, role: "ADMIN", shopId: platform.id },
    });
  } else {
    await prisma.user.create({
      data: {
        shopId: platform.id,
        name: process.env.ADMIN_NAME || "Platform Admin",
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
      },
    });
  }
  console.log(`✔ Admin ready: ${adminEmail} / ${adminPassword}`);

  // Optional demo shop for local testing: DEMO_SHOP_PHONE + DEMO_SHOP_PASSWORD
  if (process.env.DEMO_SHOP_PHONE && process.env.DEMO_SHOP_PASSWORD) {
    const demoHash = await bcrypt.hash(process.env.DEMO_SHOP_PASSWORD, 10);
    let shop = await prisma.shop.findFirst({
      where: { phone: process.env.DEMO_SHOP_PHONE, name: "Demo Pharmacy" },
    });
    if (!shop) {
      shop = await prisma.shop.create({
        data: {
          name: "Demo Pharmacy",
          phone: process.env.DEMO_SHOP_PHONE,
          ownerName: "Demo Owner",
          trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });
    }
    const demoUser = await prisma.user.findUnique({
      where: { phone: process.env.DEMO_SHOP_PHONE },
    });
    if (demoUser) {
      await prisma.user.update({
        where: { id: demoUser.id },
        data: { passwordHash: demoHash, role: "OWNER" },
      });
    } else {
      await prisma.user.create({
        data: {
          shopId: shop.id,
          name: "Demo Owner",
          phone: process.env.DEMO_SHOP_PHONE,
          passwordHash: demoHash,
          role: "OWNER",
        },
      });
    }
    console.log(`✔ Demo shop ready: ${process.env.DEMO_SHOP_PHONE}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
