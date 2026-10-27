const toggle = document.getElementById("togglePassword");

const password = document.getElementById("password");

toggle.addEventListener("click", () => {
  if (password.type === "password") {
    password.type = "text";

    toggle.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
  } else {
    password.type = "password";

    toggle.innerHTML = '<i class="fa-solid fa-eye"></i>';
  }
});

const form = document.getElementById("loginForm");

const button = document.getElementById("loginButton");

form.addEventListener("submit", () => {
  button.disabled = true;

  button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Masuk...';
});

form.addEventListener("submit", (e) => {
  if (username.value.trim() === "") {
    alert("Username wajib diisi");

    e.preventDefault();

    return;
  }

  if (password.value.trim() === "") {
    alert("Password wajib diisi");

    e.preventDefault();

    return;
  }
});
