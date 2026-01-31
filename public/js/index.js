// GLOBAL VARIABLES
const authToken = localStorage.getItem("token");
const currentUser = localStorage.getItem("username");
let exchangeRates = { SGD: 1 }; // Default
let currentCurrency = "SGD";

$(document).ready(function () {
  // 1. Auth & Navigation Logic
  if (authToken) {
    $(".auth-buttons").hide();
    $(".user-buttons").show();
    $("#displayUsername").text(currentUser);
    updateCartCount();
  } else {
    $(".auth-buttons").show();
    $(".user-buttons").hide();
  }

  $("#btnLogout").click(function () {
    localStorage.clear();
    window.location.href = "/login.html";
  });

  // 2. NEW: Load Exchange Rates
  loadExchangeRates();

  // 3. NEW: Handle Currency Change
  $("#currencySelect").change(function () {
    currentCurrency = $(this).val();
    updateAllPrices(); // Call the function to update UI
  });
});

// --- CURRENCY LOGIC ---
async function loadExchangeRates() {
  try {
    let res = await fetch("/api/rates");
    let rates = await res.json();
    exchangeRates = rates;

    // Populate Dropdown
    let select = $("#currencySelect");
    select.empty();
    Object.keys(rates).forEach((currency) => {
      select.append(`<option value="${currency}">${currency}</option>`);
    });

    // Set default if previously selected
    // (Optional: You could save this to localStorage to remember preference)
    select.val("SGD");
  } catch (e) {
    console.log("Error fetching rates:", e);
  }
}

// Global function to update any element with class 'price-display'
// It requires the element to have 'data-val' attribute with the SGD price
function updateAllPrices() {
  let rate = exchangeRates[currentCurrency] || 1;

  $(".price-display").each(function () {
    let basePrice = parseFloat($(this).attr("data-val"));
    if (!isNaN(basePrice)) {
      let converted = (basePrice * rate).toFixed(2);
      $(this).text(`${currentCurrency} ${converted}`);
    }
  });
}

// --- CART LOGIC ---
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function addToCart(id, name, price) {
  if (!authToken) {
    alert("Please login to add items to your cart!");
    window.location.href = "/login.html";
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
