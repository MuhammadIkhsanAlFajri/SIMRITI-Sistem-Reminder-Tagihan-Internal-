const prisma = require("../config/database");

exports.getLogs = async () => {
  return await prisma.activityLog.findMany({
    include: {
      user: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};

exports.createLog = async (activity, detail, userId) => {
  await prisma.activityLog.create({
    data: {
      activity,

      detail,

      userId,
    },
  });
};
