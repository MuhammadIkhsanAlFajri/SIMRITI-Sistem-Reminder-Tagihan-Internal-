require("dotenv").config();

const telegramService = require("./services/telegramService");

async function testTelegram() {
    try {
        await telegramService.sendMessage(
            "🔔 <b>SIMRITI TEST</b>\n\nTelegram Bot berhasil terhubung ke sistem SIMRITI."
        );

        console.log("==============================");
        console.log("TELEGRAM BERHASIL");
        console.log("Pesan berhasil dikirim.");
        console.log("==============================");
    } catch (error) {
        console.error("=================================");
        console.error("TELEGRAM GAGAL");
        console.error(error.message);
        console.error("=================================");
    }
}

testTelegram();