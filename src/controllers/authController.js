const activityService = require("../services/activityService");
const authService = require("../services/authService");

exports.loginPage = (req, res) => {
  res.render("login", {
    layout: false,
    error: null,
  });
};

exports.registerPage = (req, res) => {
  res.render("register", {
    layout: false,
    error: null,
  });
};

exports.register = async (req, res) => {
  try {
    await authService.register(req.body);

    res.redirect("/login");
  } catch (err) {
    res.render("register", {
      layout: false,
      error: err.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const user = await authService.login(req.body.username, req.body.password);

    req.session.user = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
    };

    await activityService.createLog("LOGIN", "Login ke sistem", user.id);

    res.redirect("/dashboard");
  } catch (err) {
    res.render("login", {
      layout: false,
      error: err.message,
      username: req.body.username,
    });
  }
};

exports.logout = async (req, res) => {
  try {
    if (req.session.user) {
      await activityService.createLog(
        "LOGOUT",
        "Logout dari sistem",
        req.session.user.id,
      );
    }
  } catch (err) {
    console.log(err);
  }

  req.session.destroy(() => {
    res.redirect("/login");
  });
};

exports.forgotPasswordPage = (req, res) => {
  res.render("forgot-password", {
    layout: false,
    error: null,
    success: null,
  });
};

exports.forgotPassword = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.render("forgot-password", {
        layout: false,
        error: "Email wajib diisi.",
        success: null,
      });
    }

    await authService.forgotPassword(email);

    res.render("forgot-password", {
      layout: false,
      error: null,
      success:
        "Jika email terdaftar, link reset password telah dikirim. Silakan cek email Anda.",
    });
  } catch (err) {
    console.error(err);

    res.render("forgot-password", {
      layout: false,
      error: "Gagal mengirim link reset password.",
      success: null,
    });
  }
};

exports.resetPasswordPage = async (req, res) => {
  try {
    const token = req.params.token;

    const resetToken =
      await require("../config/database").passwordResetToken.findUnique({
        where: {
          token,
        },
      });

    if (!resetToken) {
      return res.status(400).send("Link reset password tidak valid.");
    }

    if (new Date() > resetToken.expiresAt) {
      return res.status(400).send("Link reset password sudah kadaluarsa.");
    }

    res.render("reset-password", {
      layout: false,
      token,
      error: null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Terjadi kesalahan.");
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const token = req.params.token;

    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.render("reset-password", {
        layout: false,
        token,
        error: "Konfirmasi password tidak sesuai.",
      });
    }

    await authService.resetPassword(token, password);

    res.redirect("/login?reset=success");
  } catch (err) {
    console.error(err);

    res.render("reset-password", {
      layout: false,
      token: req.params.token,
      error: err.message,
    });
  }
};
