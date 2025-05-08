document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("cadastro-form");
    const emailInput = document.getElementById("email");
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirm-password");
    const errorMessage = document.getElementById("error-message");

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value)) {
            alert("Por favor, insira um email válido.");
            return;
        }

        if (password.value !== confirmPassword.value) {
            errorMessage.style.display = "block";
            return;
        } else {
            errorMessage.style.display = "none";
        }

        const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

        if (usuarios.some((user) => user.email === emailInput.value)) {
            alert("Este email já está cadastrado.");
            return;
        }

        const username = document.getElementById("username").value;

        const newUser = {
            username: username,
            email: emailInput.value.trim(),
            password: password.value,
        };

        usuarios.push(newUser);
        localStorage.setItem("usuarios", JSON.stringify(usuarios));
        console.log("Usuários cadastrados:", usuarios); // Depuração

        alert("Cadastro realizado com sucesso!");
        window.location.href = "../Login/login.html";
    });
});