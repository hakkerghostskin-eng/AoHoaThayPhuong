document.addEventListener("DOMContentLoaded", function() {
    const backend = window.MediCloudBackend;
    const loginForm = document.getElementById("loginForm");
    const errorBox = document.getElementById("loginError");
    const successBox = document.getElementById("loginSuccess");
    const button = document.getElementById("loginButton");

    if (!backend || !loginForm) {
        return;
    }

    if (backend.getCurrentUser()) {
        window.location.href = "index.html";
        return;
    }

    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim().toLowerCase();
        const password = document.getElementById("password").value;
        const rememberMe = document.getElementById("rememberMe").checked;

        errorBox.style.display = "none";
        successBox.style.display = "none";
        button.disabled = true;
        button.textContent = "Dang dang nhap...";

        try {
            await backend.login({
                email: email,
                password: password,
                rememberMe: rememberMe
            });

            successBox.textContent = "Dang nhap thanh cong. Dang chuyen den Dashboard...";
            successBox.style.display = "block";

            setTimeout(function() {
                window.location.href = "index.html";
            }, 700);
        } catch (error) {
            errorBox.textContent = "Dang nhap that bai: " + error.message;
            errorBox.style.display = "block";
            button.disabled = false;
            button.textContent = "Dang nhap";
        }
    });
});
