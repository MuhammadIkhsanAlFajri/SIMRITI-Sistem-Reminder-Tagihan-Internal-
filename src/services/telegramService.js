const axios = require ("axios");

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

exports.sendMessage = async (message) => {
    if (!BOT_TOKEN) {
        throw new Error ("TELEGRAM_BOT_TOKEN belum diatur di .env");
    }

    if (!CHAT_ID) {
        throw new Error ("TELEGRAM_CHAT_ID belum diatur di .env");
    }

    try {
        const response = await axios.post(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
            {
                chat_id: CHAT_ID,
                text: message,
                parse_mode: "HTML",
            }
        );

        return response.data;
    } catch (error) {

        console.error(
            "Telegram Error:",
            error.response?.data || error.message
        );

        throw error;
    }
};