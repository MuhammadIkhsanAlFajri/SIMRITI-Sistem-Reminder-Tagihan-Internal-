const prisma = require("../config/database");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const emailService = require("./emailService");

exports.login = async (username, password) => {
  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  if (!user) {
    throw new Error("Username tidak ditemukan.");
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    throw new Error("Password yang dimasukkan salah.");
  }

  return user;
};

exports.register = async (body) => {
  const exist = await prisma.user.findUnique({
    where: {
      username: body.username,
    },
  });

  if (exist) {
    throw new Error("Username sudah digunakan");
  }

  const existEmail = await prisma.user.findUnique({
    where: {
      email: body.email,
    },
  });

  if (existEmail) {
    throw new Error("Email sudah digunakan");
  }

  if (body.password !== body.confirmPassword) {
    throw new Error("Konfirmasi password tidak sesuai");
  }

  const hash = await bcrypt.hash(body.password, 10);

  await prisma.user.create({
    data: {
      username: body.username,
      fullName: body.fullName,
      email: body.email,
      password: hash,
    },
  });
};

exports.forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  // Jangan membocorkan apakah email terdaftar atau tidak
  if (!user) {
    return;
  }

  // Hapus token lama milik user
  await prisma.passwordResetToken.deleteMany({
    where: {
      userId: user.id,
    },
  });

  const token = crypto.randomBytes(32).toString("hex");

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      token,
      expiresAt,
      userId: user.id,
    },
  });

  const resetUrl = `${process.env.APP_URL}/reset-password/${token}`;

  await emailService.sendPasswordResetEmail(user.email, resetUrl);
};

exports.resetPassword = async (token, newPassword) => {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: {
      token,
    },
  });

  if (!resetToken) {
    throw new Error("Link reset password tidak valid.");
  }

  if (new Date() > resetToken.expiresAt) {
    await prisma.passwordResetToken.delete({
      where: {
        id: resetToken.id,
      },
    });

    throw new Error("Link reset password sudah kadaluarsa.");
  }

  if (!newPassword || newPassword.length < 6) {
    throw new Error("Password minimal 6 karakter.");
  }

  const hash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: resetToken.userId,
      },
      data: {
        password: hash,
      },
    }),

    prisma.passwordResetToken.delete({
      where: {
        id: resetToken.id,
      },
    }),
  ]);
};
