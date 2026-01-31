$(document).ready(function () {
  $("#btnSubmitLogin").click(async function () {
    let email = $("#loginEmail").val();
    let password = $("#loginPass").val();

    try {
      let response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        let data = await response.json();
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.user.username);
        window.location.href = "/index.html";
      } else {
        let err = await response.json();
        alert("Login Failed: " + err.error);
      }
    } catch (e) {
      alert("Error: " + e.message);
    }
  });

  $("#btnSubmitRegister").click(async function () {
    let data = {
      username: $("#regUser").val(),
      email: $("#regEmail").val(),
      password: $("#regPass").val(),
      postalCode: $("#regPostal").val(),
    };
    try {
      let response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        alert("Registered! Please Login.");
        window.location.href = "/login.html";
      } else {
        let err = await response.json();
        alert("Error: " + err.error);
      }
    } catch (e) {
      alert("Error: " + e.message);
    }
  });
});
