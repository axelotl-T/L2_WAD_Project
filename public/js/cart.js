// GLOBAL VARIABLES (Available to all other scripts)
const authToken = localStorage.getItem("token");
const currentUser = localStorage.getItem("username");

$(document).ready(function () {
  // 1. Update Navbar based on Auth Status
  if (authToken) {
    $(".auth-buttons").hide(); // Hide Login/Register
    $(".user-buttons").show(); // Show Logout/Admin/Cart
    $("#displayUsername").text(currentUser);
    updateCartCount(); // Update badge
  } else {
    $(".auth-buttons").show();
    $(".user-buttons").hide();
  }

  // 2. Bind Logout Button
  $("#btnLogout").click(function () {
    localStorage.clear();
    window.location.href = "/login.html";
  });
});

// --- SHARED CART LOGIC ---
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function addToCart(id, name, price) {
  // --- NEW: Check if User is Logged In ---
  if (!authToken) {
    alert("Please login to add items to your cart.");
    window.location.href = "/login.html"; // Redirect to Login
    return;
  }

  let cart = getCart();
  let existingItem = cart.find((item) => item.id === id);

  if (existingItem) {
    existingItem.qty += 1;
    alert(`Increased quantity of ${name}.`);
  } else {
    cart.push({ id, name, price, qty: 1 });
    alert(`${name} added to cart!`);
  }
  saveCart(cart);
}

function updateCartCount() {
  let cart = getCart();
  let total = cart.reduce((sum, item) => sum + item.qty, 0);
  $("#cart-count").text(total);
}
