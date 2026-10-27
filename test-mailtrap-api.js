require("dotenv").config();

const { MailtrapClient } = require("mailtrap");

const client = new MailtrapClient({
  token: process.env.MAILTRAP_API_TOKEN,
  sandbox: true,
  testInboxId: Number(process.env.MAILTRAP_INBOX_ID),
});

const sender = {
  email: "noreply@simriti.local",
  name: "SIMRITI",
};

async function testEmail() {
  try {
    console.log("Mengirim email melalui Mailtrap Sandbox...");
    console.log("Inbox ID:", process.env.MAILTRAP_INBOX_ID);

    const response = await client.send({
      from: sender,
      to: [
        {
          email: "test@example.com",
        },
      ],
      subject: "Test Email SIMRITI",
      text: "Test email dari SIMRITI.",
      html: `
        <h2>Test Email SIMRITI</h2>
        <p>
          Jika email ini masuk ke Mailtrap Sandbox,
          berarti API email SIMRITI sudah berhasil.
        </p>
      `,
      category: "SIMRITI Test",
    });

    console.log("================================");
    console.log("EMAIL BERHASIL DIKIRIM");
    console.log("================================");
    console.log(response);
  } catch (error) {
    console.error("MAILTRAP API ERROR:");
    console.error(error);
  }
}

testEmail();