const prisma = require("./config/database");

async function test() {
  try {
    await prisma.$connect();

    console.log("================================");

    console.log("DATABASE CONNECTED");

    console.log("================================");
  } catch (err) {
    console.log(err);
  }
}

test();
