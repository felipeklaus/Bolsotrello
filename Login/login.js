document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
        console.log("Usuários no localStorage:", usuarios); // Verifica os usuários salvos
        console.log("E-mail inserido:", emailInput.value.trim()); // Verifica o e-mail digitado
        console.log("Senha inserida:", passwordInput.value); 

        const usuarioValido = usuarios.find(
            (user) => user.email.trim().toLowerCase() === emailInput.value.trim().toLowerCase() &&
                      user.password === passwordInput.value
        );

        if (usuarioValido) {
            console.log("Usuário encontrado:", usuarioValido);
            alert(`Bem-vindo, ${usuarioValido.username}!`);
            window.location.href = "../Menu/menu.html";
        } else {
            console.log("Usuário não encontrado ou credenciais incorretas.");
            alert("E-mail ou senha incorretos!");
        }
    });
});