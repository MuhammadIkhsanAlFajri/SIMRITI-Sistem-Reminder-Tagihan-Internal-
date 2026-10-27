const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// ========================================
// KIRIM EMAIL REMINDER TAGIHAN
// ========================================

exports.sendReminderEmail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"SIMRITI Reminder" <${process.env.EMAIL_USER}>`,

      to,

      subject,

      text,

      html,
    });

    console.log("================================");
    console.log("EMAIL REMINDER BERHASIL DIKIRIM");
    console.log("Penerima:", to);
    console.log("Accepted:", info.accepted);
    console.log("Rejected:", info.rejected);
    console.log("Response:", info.response);
    console.log("Message ID:", info.messageId);
    console.log("================================");

    return info;
  } catch (error) {
    console.error("================================");
    console.error("EMAIL REMINDER ERROR");
    console.error(error.message);
    console.error("================================");

    throw error;
  }
};

// ========================================
// KIRIM EMAIL RESET PASSWORD
// ========================================

exports.sendPasswordResetEmail = async (email, resetUrl) => {
  try {
    const info = await transporter.sendMail({
      from: `"SIMRITI" <${process.env.EMAIL_USER}>`,

      to: email,

      subject: "Reset Password SIMRITI",

      text: `
Halo,

Kami menerima permintaan untuk mereset password akun SIMRITI Anda.

Silakan buka link berikut untuk membuat password baru:

${resetUrl}

Link reset password ini hanya berlaku selama 15 menit.

Jika Anda tidak meminta reset password, silakan abaikan email ini.

Salam,
SIMRITI
Smart Invoice Reminder System
      `,

      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reset Password SIMRITI</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f4f6f8;
  font-family:Arial,Helvetica,sans-serif;
">

  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="background:#f4f6f8;"
  >
    <tr>
      <td align="center" style="padding:40px 15px;">

        <!-- CARD UTAMA -->
        <table
          width="600"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            max-width:600px;
            width:100%;
            background:#ffffff;
            border-radius:12px;
            overflow:hidden;
            box-shadow:0 4px 15px rgba(0,0,0,0.08);
          "
        >

          <!-- HEADER -->
          <tr>
            <td
              style="
                padding:28px;
                text-align:center;
                background:#ffffff;
                border-bottom:1px solid #eeeeee;
              "
            >

              <div
                style="
                  font-size:28px;
                  font-weight:bold;
                  color:#111827;
                "
              >
                SIMRITI
              </div>

              <div
                style="
                  margin-top:6px;
                  font-size:13px;
                  color:#6b7280;
                "
              >
                Smart Invoice Reminder System
              </div>

            </td>
          </tr>

          <!-- ISI -->
          <tr>
            <td style="padding:35px;">

              <h2
                style="
                  margin:0 0 15px 0;
                  font-size:24px;
                  color:#111827;
                "
              >
                Reset Password
              </h2>

              <p
                style="
                  margin:0 0 18px 0;
                  color:#4b5563;
                  font-size:15px;
                  line-height:1.7;
                "
              >
                Halo,
              </p>

              <p
                style="
                  margin:0 0 25px 0;
                  color:#4b5563;
                  font-size:15px;
                  line-height:1.7;
                "
              >
                Kami menerima permintaan untuk mereset password
                akun SIMRITI Anda.
              </p>

              <!-- HIGHLIGHT -->
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
              >
                <tr>
                  <td
                    style="
                      background:#f8fafc;
                      border:1px solid #e5e7eb;
                      border-radius:10px;
                      padding:20px;
                      text-align:center;
                    "
                  >

                    <div
                      style="
                        font-size:13px;
                        color:#6b7280;
                        margin-bottom:8px;
                      "
                    >
                      AKSI YANG DIPERLUKAN
                    </div>

                    <div
                      style="
                        font-size:18px;
                        font-weight:bold;
                        color:#111827;
                      "
                    >
                      Buat Password Baru
                    </div>

                  </td>
                </tr>
              </table>

              <!-- BUTTON -->
              <div
                style="
                  text-align:center;
                  margin:30px 0;
                "
              >

                <a
                  href="${resetUrl}"
                  style="
                    display:inline-block;
                    padding:14px 30px;
                    background:#2563eb;
                    color:#ffffff;
                    text-decoration:none;
                    border-radius:8px;
                    font-size:15px;
                    font-weight:bold;
                  "
                >
                  Reset Password
                </a>

              </div>

              <!-- LINK ALTERNATIF -->
              <p
                style="
                  margin:0 0 10px 0;
                  color:#6b7280;
                  font-size:13px;
                  line-height:1.6;
                "
              >
                Jika tombol di atas tidak dapat digunakan,
                buka link berikut:
              </p>

              <p
                style="
                  margin:0 0 25px 0;
                  word-break:break-all;
                  font-size:13px;
                  line-height:1.6;
                "
              >
                <a
                  href="${resetUrl}"
                  style="
                    color:#2563eb;
                    text-decoration:none;
                  "
                >
                  ${resetUrl}
                </a>
              </p>

              <!-- EXPIRED -->
              <p
                style="
                  margin:0 0 10px 0;
                  color:#4b5563;
                  font-size:14px;
                  line-height:1.6;
                "
              >
                Link reset password ini berlaku selama
                <strong>15 menit</strong>.
              </p>

              <p
                style="
                  margin:0;
                  color:#6b7280;
                  font-size:13px;
                  line-height:1.6;
                "
              >
                Jika Anda tidak meminta reset password,
                silakan abaikan email ini.
              </p>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td
              style="
                padding:20px 30px;
                text-align:center;
                background:#f8fafc;
                border-top:1px solid #eeeeee;
              "
            >

              <div
                style="
                  font-size:12px;
                  color:#9ca3af;
                "
              >
                Email otomatis dari SIMRITI
              </div>

              <div
                style="
                  margin-top:5px;
                  font-size:12px;
                  color:#9ca3af;
                "
              >
                Smart Invoice Reminder System
              </div>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
      `,
    });

    console.log("================================");
    console.log("EMAIL RESET PASSWORD BERHASIL DIKIRIM");
    console.log("Penerima:", email);
    console.log("Accepted:", info.accepted);
    console.log("Rejected:", info.rejected);
    console.log("Response:", info.response);
    console.log("Message ID:", info.messageId);
    console.log("================================");

    return info;
  } catch (error) {
    console.error("================================");
    console.error("EMAIL RESET PASSWORD ERROR");
    console.error(error.message);
    console.error("================================");

    throw error;
  }
};

// ========================================
// CEK KONEKSI EMAIL
// ========================================

exports.verifyEmailConnection = async () => {
  try {
    await transporter.verify();

    console.log("--------------------------------");
    console.log("EMAIL SERVICE TERHUBUNG");
    console.log(`Email: ${process.env.EMAIL_USER}`);
    console.log("--------------------------------");

    return true;
  } catch (error) {
    console.error("--------------------------------");
    console.error("EMAIL SERVICE GAGAL TERHUBUNG");
    console.error(error.message);
    console.error("--------------------------------");

    return false;
  }
};
