// Global Variables
let authToken = localStorage.getItem("token");
let currentUser = localStorage.getItem("username");
let cart = [];
let exchangeRates = {};
let categories = [];

// Initialization
$(document).ready(function () {
  // Check if logged in
  if (authToken) {
    initApp();
  } else {
    $("#view-auth").show();
  }

  // Event Listeners
  $("#btnLogin").on("click", login);
  $("#btnRegister").on("click", register);

  // Initial Data Fetch
  fetchRates();
  fetchCategories();
});

function initApp() {
  $("#view-auth").hide();
  $("#nav-buttons").removeClass("hidden").show();
  $("#displayUsername").text(currentUser);
  switchView("dashboard");
}

function switchView(viewName) {
  // Hide all views first
  $("#view-dashboard, #view-shop, #view-cart, #view-auth").hide();

  if (viewName === "dashboard") {
    $("#view-dashboard").show();
    loadAdminProducts();
  } else if (viewName === "shop") {
    $("#view-shop").show();
    loadShopProducts();
  } else if (viewName === "cart") {
    $("#view-cart").show();
    renderCart();
    loadUserProfile();
  }
}

// ---------------------------------------------------
// AUTH FUNCTIONS (Async/Await + Fetch)
// ---------------------------------------------------

async function login() {
  let email = $("#loginEmail").val();
  let password = $("#loginPass").val();

  try {
    let response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: password }),
    });

    if (response.ok) {
      let data = await response.json();
      authToken = data.token;
      currentUser = data.user.username;

      localStorage.setItem("token", authToken);
      localStorage.setItem("username", currentUser);

      initApp();
    } else {
      let err = await response.json();
      alert("Login failed: " + err.error);
    }
  } catch (e) {
    alert("Server error: " + e.message);
  }
}

async function register() {
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
      alert("Registered successfully!");
      $("#reg-box").hide();
      $("#login-box").show();
    } else {
      let err = await response.json();
      alert("Registration failed: " + err.error);
    }
  } catch (e) {
    alert("Server error: " + e.message);
  }
}

async function logout() {
  // Optional: Call server logout if you implemented it in previous steps
  // For now, we clear local state as per standard client-side logout
  if (authToken) {
    try {
      await fetch("/api/logout", {
        method: "POST",
        headers: { Authorization: "Bearer " + authToken },
      });
    } catch (e) {
      console.log("Logout error", e);
    }
  }
  localStorage.clear();
  location.reload();
}

// ---------------------------------------------------
// USER PROFILE
// ---------------------------------------------------

async function loadUserProfile() {
  try {
    let response = await fetch("/api/user", {
      method: "GET",
      headers: { Authorization: "Bearer " + authToken },
    });

    if (response.ok) {
      let user = await response.json();
      $("#checkout-name").text(user.username);
      $("#checkout-email").text(user.email);

      let addr = user.address || {};
      let fullAddr = addr.postalCode
        ? `${addr.building || ""} ${addr.streetName || ""}, Singapore ${addr.postalCode}`
        : "No address provided";
      $("#checkout-address").text(fullAddr);
    } else {
      $("#checkout-name").text("Error loading profile");
    }
  } catch (e) {
    console.log(e);
  }
}

// ---------------------------------------------------
// CART & CHECKOUT
// ---------------------------------------------------

function addToCart(id, name, price) {
  let existingItem = cart.find((item) => item.id === id);
  if (existingItem) {
    existingItem.qty += 1;
    alert(`Increased quantity of ${name} to ${existingItem.qty}`);
  } else {
    cart.push({ id, name, price, qty: 1 });
    alert(`${name} added to cart!`);
  }
  updateCartCount();
}

function updateCartCount() {
  let totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  $("#cart-count").text(totalCount);
}

function changeQty(index, change) {
  cart[index].qty += change;
  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }
  updateCartCount();
  renderCart();
}

function renderCart() {
  let container = $("#cart-items-container");
  container.empty();
  let total = 0;

  if (cart.length === 0) {
    container.append("<p>Cart is empty.</p>");
  } else {
    cart.forEach((item, index) => {
      let itemTotal = item.price * item.qty;
      total += itemTotal;

      let html = `
                <div class="cart-item">
                    <div style="flex-grow:1">
                        <b>${item.name}</b><br>
                        Unit Price: $${item.price}
                    </div>
                    <div style="display:flex; align-items:center;">
                        <button class="qty-btn btn-secondary" onclick="changeQty(${index}, -1)">-</button>
                        <span class="qty-val">${item.qty}</span>
                        <button class="qty-btn btn-success" onclick="changeQty(${index}, 1)">+</button>
                    </div>
                    <div style="width:100px; text-align:right; font-weight:bold;">
                        $${itemTotal.toFixed(2)}
                    </div>
                    <button class="btn btn-danger" style="margin-left:10px" onclick="changeQty(${index}, -9999)">X</button>
                </div>
            `;
      container.append(html);
    });
  }
  $("#cart-total-sgd").text(total.toFixed(2));
  updateTotalCurrency();
}

async function checkout() {
  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }

  if (!confirm("Confirm payment and place order?")) return;

  try {
    let response = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + authToken,
      },
      body: JSON.stringify({ cart: cart }),
    });

    if (response.ok) {
      let result = await response.json();
      alert("Payment Successful! " + result.message);

      // Reset Cart
      cart = [];
      updateCartCount();
      renderCart();
      switchView("shop");
    } else {
      let err = await response.json();
      alert("Checkout Failed: " + err.error);
    }
  } catch (e) {
    alert("Server error: " + e.message);
  }
}

// ---------------------------------------------------
// ADMIN PRODUCT MANAGEMENT
// ---------------------------------------------------

async function loadAdminProducts() {
  try {
    let response = await fetch("/api/products");
    if (response.ok) {
      let products = await response.json();
      let container = $("#admin-products-list");
      container.empty();

      if (products.length === 0) {
        container.html("<p>No products found.</p>");
        return;
      }

      products.forEach((p) => {
        container.append(`
                <div class="card">
                    <h4>${p.name} ($${p.price})</h4>
                    <p>${p.description}</p>
                    <p>Cat: <b>${p.category}</b> | Stock: ${p.stock}</p>
                    <button class="btn btn-warning" onclick="editProduct('${p._id}')">Edit Product</button>
                    <button class="btn btn-danger" onclick="deleteProduct('${p._id}')">Delete Product</button>
                    
                    <button class="btn btn-info" onclick="$('#admin-rev-${p._id}').slideToggle()">Manage Reviews</button>
                    
                    <div id="admin-rev-${p._id}" class="reviews-container">
                        <h5>Reviews</h5>
                        <div id="admin-rev-list-${p._id}">Loading...</div>
                        <hr>
                        <small>Add Admin Comment:</small>
                        <div style="margin-top:5px;">
                            <input type="text" id="admin-rev-txt-${p._id}" placeholder="Comment" style="width:60%">
                            <input type="number" id="admin-rev-rate-${p._id}" placeholder="1-5" style="width:15%">
                            <button class="btn btn-sm btn-primary" onclick="postReview('${p._id}', false)">Post</button>
                        </div>
                    </div>
                </div>`);
        loadAdminReviews(p._id);
      });
    }
  } catch (e) {
    console.log("Error loading products", e);
  }
}

async function saveProduct() {
  let id = $("#prodId").val();
  let data = {
    name: $("#prodName").val(),
    description: $("#prodDesc").val(),
    price: $("#prodPrice").val(),
    stock: $("#prodStock").val(),
    category: $("#prodCat").val(),
  };

  let method = id ? "PUT" : "POST";
  let url = id ? `/api/products/${id}` : "/api/products";

  try {
    let response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + authToken,
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      $("#product-form").slideUp();
      loadAdminProducts();
    } else {
      let err = await response.json();
      alert("Error saving product: " + err.error);
    }
  } catch (e) {
    alert("Server error: " + e.message);
  }
}

async function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;

  try {
    let response = await fetch(`/api/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + authToken },
    });

    if (response.ok) {
      loadAdminProducts();
    } else {
      alert("Error deleting product");
    }
  } catch (e) {
    alert("Server error: " + e.message);
  }
}

async function editProduct(id) {
  try {
    let response = await fetch(`/api/products/${id}`);
    if (response.ok) {
      let p = await response.json();
      $("#prodId").val(p._id);
      $("#prodName").val(p.name);
      $("#prodDesc").val(p.description);
      $("#prodPrice").val(p.price);
      $("#prodStock").val(p.stock);
      $("#prodCat").val(p.category);
      $("#product-form").slideDown();
      $("html, body").animate(
        { scrollTop: $("#product-form").offset().top - 100 },
        500,
      );
    }
  } catch (e) {
    console.log(e);
  }
}

// ---------------------------------------------------
// SHOP & REVIEWS
// ---------------------------------------------------

async function loadShopProducts() {
  let selectedCat = $("#shopFilter").val();
  let url = "/api/products";
  if (selectedCat !== "All")
    url += "?category=" + encodeURIComponent(selectedCat);

  try {
    let response = await fetch(url);
    if (response.ok) {
      let products = await response.json();
      let container = $("#shop-container");
      container.empty();

      if (products.length === 0) {
        container.html("<p>No products found.</p>");
        return;
      }

      products.forEach((p) => {
        container.append(`
                    <div class="shop-card" style="border:1px solid #eee; padding:15px; margin:5px; background:white;">
                        <h4>${p.name}</h4>
                        <p>${p.description}</p>
                        <div class="price-tag">$${p.price}</div>
                        
                        <button class="btn btn-primary" onclick="addToCart('${p._id}', '${p.name}', ${p.price})">Add to Cart</button>
                        <button class="btn btn-info" onclick="$('#shop-rev-${p._id}').slideToggle()">Show Reviews</button>
                        
                        <div id="shop-rev-${p._id}" class="reviews-container">
                            <small><b>Write a Review:</b></small><br>
                            <input type="text" id="shop-rev-txt-${p._id}" placeholder="Comment" style="width:60%">
                            <input type="number" id="shop-rev-rate-${p._id}" placeholder="1-5" style="width:20%">
                            <button class="btn btn-sm btn-success" onclick="postReview('${p._id}', true)">Post</button>
                            <hr>
                            <div id="shop-rev-list-${p._id}">Loading...</div>
                        </div>
                    </div>
                `);
        loadShopReviews(p._id);
      });
    }
  } catch (e) {
    console.log(e);
  }
}

async function loadShopReviews(pid) {
  try {
    let response = await fetch(`/api/products/${pid}/reviews`);
    if (response.ok) {
      let reviews = await response.json();
      let div = $(`#shop-rev-list-${pid}`);
      div.empty();
      if (reviews.length === 0) {
        div.append("<small>No reviews yet.</small>");
        return;
      }
      reviews.forEach((r) => {
        let username = r.user ? r.user.username : "Unknown";
        div.append(
          `<div class="shop-review-item"><b>${username}</b>: ${r.comment} (${r.rating}/5)</div>`,
        );
      });
    }
  } catch (e) {
    console.log(e);
  }
}

// ---------------------------------------------------
// SHARED REVIEW LOGIC
// ---------------------------------------------------

async function loadAdminReviews(pid) {
  try {
    let response = await fetch(`/api/products/${pid}/reviews`);
    if (response.ok) {
      let reviews = await response.json();
      let div = $(`#admin-rev-list-${pid}`);
      div.empty();
      if (reviews.length === 0) {
        div.append("<small>No reviews yet.</small>");
        return;
      }
      reviews.forEach((r) => {
        let userDisplay = r.user ? r.user.username : "Unknown";
        div.append(`
                    <div id="rev-item-${r._id}" class="admin-review-item">
                        <div style="display:flex; justify-content:space-between;">
                            <span><b>${userDisplay}</b>: ${r.comment} (${r.rating}/5)</span>
                            <div>
                                <button class="btn btn-sm btn-secondary" onclick="editReviewUI('${r._id}', '${r.comment}', ${r.rating}, '${pid}')">Edit</button>
                                <button class="btn btn-sm btn-danger" onclick="deleteReview('${r._id}', '${pid}')">Del</button>
                            </div>
                        </div>
                    </div>
                `);
      });
    }
  } catch (e) {
    console.log(e);
  }
}

async function postReview(pid, isShopView) {
  let prefix = isShopView ? "shop-rev" : "admin-rev";
  let comment = $(`#${prefix}-txt-${pid}`).val();
  let rating = $(`#${prefix}-rate-${pid}`).val();

  if (!comment || !rating) {
    alert("Please fill in comment and rating");
    return;
  }

  let data = { productId: pid, comment: comment, rating: rating };

  try {
    let response = await fetch("/api/reviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + authToken,
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      alert("Review Posted!");
      $(`#${prefix}-txt-${pid}`).val("");
      $(`#${prefix}-rate-${pid}`).val("");
      if (isShopView) loadShopReviews(pid);
      else loadAdminReviews(pid);
    } else {
      let err = await response.json();
      alert("Error: " + err.error);
    }
  } catch (e) {
    alert("Server error: " + e.message);
  }
}

async function deleteReview(rid, pid) {
  if (!confirm("Delete this review?")) return;

  try {
    let response = await fetch(`/api/reviews/${rid}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + authToken },
    });

    if (response.ok) {
      loadAdminReviews(pid);
    } else {
      alert("Error deleting review");
    }
  } catch (e) {
    alert("Server error: " + e.message);
  }
}

function editReviewUI(rid, oldComment, oldRating, pid) {
  let html = `
        <input type="text" id="edit-txt-${rid}" value="${oldComment}" style="width:50%">
        <input type="number" id="edit-rate-${rid}" value="${oldRating}" style="width:15%">
        <button class="btn btn-sm btn-success" onclick="saveReview('${rid}', '${pid}')">Save</button>
        <button class="btn btn-sm btn-secondary" onclick="loadAdminReviews('${pid}')">Cancel</button>
    `;
  $(`#rev-item-${rid}`).html(html);
}

async function saveReview(rid, pid) {
  let data = {
    comment: $(`#edit-txt-${rid}`).val(),
    rating: $(`#edit-rate-${rid}`).val(),
  };

  try {
    let response = await fetch(`/api/reviews/${rid}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + authToken,
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      loadAdminReviews(pid);
    } else {
      alert("Update failed");
    }
  } catch (e) {
    alert("Server error: " + e.message);
  }
}

// ---------------------------------------------------
// HELPER FUNCTIONS
// ---------------------------------------------------

async function fetchCategories() {
  try {
    let response = await fetch("/api/categories");
    if (response.ok) {
      let cats = await response.json();
      categories = cats;
      let adminSelect = $("#prodCat");
      let shopSelect = $("#shopFilter");

      adminSelect.empty();
      shopSelect.html('<option value="All">All Categories</option>');

      cats.forEach((c) => {
        adminSelect.append(`<option value="${c.name}">${c.name}</option>`);
        shopSelect.append(`<option value="${c.name}">${c.name}</option>`);
      });
    }
  } catch (e) {
    console.log(e);
  }
}

async function fetchRates() {
  try {
    let response = await fetch("/api/rates");
    if (response.ok) {
      let rates = await response.json();
      exchangeRates = rates;
      let select = $("#currency-select");
      Object.keys(rates).forEach((c) => {
        if (c !== "SGD") select.append(`<option value="${c}">${c}</option>`);
      });
    }
  } catch (e) {
    console.log(e);
  }
}

function updateTotalCurrency() {
  let total = parseFloat($("#cart-total-sgd").text());
  let cur = $("#currency-select").val();
  let rate = exchangeRates[cur] || 1;
  $("#final-total").text((total * rate).toFixed(2));
  $("#currency-label").text(cur);
}
