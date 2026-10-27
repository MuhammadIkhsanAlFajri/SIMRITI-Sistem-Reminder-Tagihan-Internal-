const prisma = require ("../config/database");
exports.getNotifications = async () => {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);
    const bills = await prisma.bill.findMany({
        where: {
            dueDate: {
                gte: today,
                lte: nextMonth
            },
            status: {
                in: [
                    "MENUNGGU_PEMBAYARAN",
                    "AKAN_JATUH_TEMPO"
                ]
            }
        },
        orderBy: {
            dueDate: "asc"
        },
        take: 3,
        include: {
            vendor: true
        }
    });

    return bills;
};