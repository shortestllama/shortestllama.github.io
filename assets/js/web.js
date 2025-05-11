document.getElementById("login-form").addEventListener("submit", function(e) {
  e.preventDefault();

  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;

  // Simulated SQL Injection check
  if (user.includes("'") && user.toLowerCase().includes("or 1=1") && pass === "") {
    // Flag discovery
    localStorage.setItem("flag1", "true");
    sessionStorage.setItem("LoggedIn", "true");
    window.location.href = "/flags/batcomputer/home";
  } else {
    document.getElementById("error").style.display = "block";
  }
});
