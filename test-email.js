require("dotenv").config();

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

async function testEmail() {
  try {
    console.log("Mencoba koneksi SMTP...");
    console.log("Host:", process.env.SMTP_HOST);
    console.log("Port:", process.env.SMTP_PORT);

    await transporter.verify();

    console.log("================================");
    console.log("SMTP MAILTRAP BERHASIL TERHUBUNG");
    console.log("================================");

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: "test@example.com",
      subject: "Test Email SIMRITI",
      html: `
        <h2>Test Email SIMRITI</h2>
        <p>
          Jika kamu melihat email ini di Mailtrap,
          berarti SMTP SIMRITI sudah berhasil.
        </p>
      `,
    });

    console.log("EMAIL BERHASIL DIKIRIM");
    console.log("Message ID:", info.messageId);
  } catch (error) {
    console.error("SMTP ERROR:");
    console.error(error);
  }
}

testEmail();