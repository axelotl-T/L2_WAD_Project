let authToken = localStorage.getItem("token");
let currentUser = localStorage.getItem("username");
let cart = [];
let exchangeRates = {};
let categories = [];

$(document).ready(function () {
  // Initialize App
  if (authToken) {
    initApp();
  } else {
    $("#view-auth").show();
  }

  // Auth Listeners
  $("#btnLogin").click(login);
  $("#btnRegister").click(register);

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
  }
}

// --- AUTH FUNCTIONS ---
function login() {
  let email = $("#loginEmail").val();
  let password = $("#loginPass").val();
  $.ajax({
    url: "/api/login",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({ email, password }),
    success: function (res) {
      authToken = res.token;
      currentUser = res.user.username;
      localStorage.setItem("token", authToken);
      localStorage.setItem("username", currentUser);
      initApp();
    },
    error: function (e) {
      alert(
        "Login failed: " +
          (e.responseJSON ? e.responseJSON.error : "Unknown Error"),
      );
    },
  });
}

function register() {
  let data = {
    username: $("#regUser").val(),
    email: $("#regEmail").val(),
    password: $("#regPass").val(),
    postalCode: $("#regPostal").val(),
  };
  $.ajax({
    url: "/api/register",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(data),
    success: function (res) {
      alert("Registered successfully!");
      $("#reg-box").hide();
      $("#login-box").show();
    },
    error: function (e) {
      alert(
        "Registration failed: " +
          (e.responseJSON ? e.responseJSON.error : "Unknown Error"),
      );
    },
  });
}

function logout() {
  localStorage.clear();
  location.reload();
}

// --- CART LOGIC ---
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
      container.append(`
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
            `);
    });
  }
  $("#cart-total-sgd").text(total.toFixed(2));
  updateTotalCurrency();
}

// --- ADMIN PRODUCTS & REVIEWS ---
function loadAdminProducts() {
  $.get("/api/products", function (products) {
    let container = $("#admin-products-list");
    container.empty();
    if (!products || products.length === 0) {
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
  });
}

function loadAdminReviews(pid) {
  $.get(`/api/products/${pid}/reviews`, function (reviews) {
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
  });
}

// Admin Actions
function deleteReview(rid, pid) {
  if (confirm("Delete this review?")) {
    $.ajax({
      url: `/api/reviews/${rid}`,
      method: "DELETE",
      headers: { Authorization: "Bearer " + authToken },
      success: () => loadAdminReviews(pid),
      error: (e) => alert("Error deleting: " + e.responseJSON.error),
    });
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

function saveReview(rid, pid) {
  let data = {
    comment: $(`#edit-txt-${rid}`).val(),
    rating: $(`#edit-rate-${rid}`).val(),
  };
  $.ajax({
    url: `/api/reviews/${rid}`,
    method: "PUT",
    headers: { Authorization: "Bearer " + authToken },
    data: data,
    success: () => loadAdminReviews(pid),
    error: (e) => alert("Update failed"),
  });
}

function saveProduct() {
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
  $.ajax({
    url: url,
    method: method,
    headers: { Authorization: "Bearer " + authToken },
    data: data,
    success: function () {
      $("#product-form").slideUp();
      loadAdminProducts();
    },
    error: function (e) {
      alert(
        "Error saving product: " +
          (e.responseJSON ? e.responseJSON.error : "Unknown"),
      );
    },
  });
}

function editProduct(id) {
  $.get(`/api/products/${id}`, function (p) {
    $("#prodId").val(p._id);
    $("#prodName").val(p.name);
    $("#prodDesc").val(p.description);
    $("#prodPrice").val(p.price);
    $("#prodStock").val(p.stock);
    $("#prodCat").val(p.category);
    $("#product-form").slideDown();
    // Scroll to form
    $("html, body").animate(
      { scrollTop: $("#product-form").offset().top - 100 },
      500,
    );
  });
}

function deleteProduct(id) {
  if (confirm("Delete this product?")) {
    $.ajax({
      url: `/api/products/${id}`,
      method: "DELETE",
      headers: { Authorization: "Bearer " + authToken },
      success: loadAdminProducts,
    });
  }
}

// --- SHOP PRODUCTS & REVIEWS ---
function loadShopProducts() {
  let selectedCat = $("#shopFilter").val();
  let url = "/api/products";
  if (selectedCat !== "All")
    url += "?category=" + encodeURIComponent(selectedCat);

  $.get(url, function (products) {
    let container = $("#shop-container");
    container.empty();
    if (!products || products.length === 0) {
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
  });
}

function loadShopReviews(pid) {
  $.get(`/api/products/${pid}/reviews`, function (reviews) {
    let div = $(`#shop-rev-list-${pid}`);
    div.empty();
    if (reviews.length === 0) {
      div.append("<small>No reviews yet.</small>");
      return;
    }
    reviews.forEach((r) => {
      div.append(
        `<div class="shop-review-item"><b>${r.user ? r.user.username : "Unknown"}</b>: ${r.comment} (${r.rating}/5)</div>`,
      );
    });
  });
}

function postReview(pid, isShopView) {
  let prefix = isShopView ? "shop-rev" : "admin-rev";
  let comment = $(`#${prefix}-txt-${pid}`).val();
  let rating = $(`#${prefix}-rate-${pid}`).val();

  if (!comment || !rating) {
    alert("Please fill in comment and rating");
    return;
  }
  let data = { productId: pid, comment: comment, rating: rating };

  $.ajax({
    url: "/api/reviews",
    method: "POST",
    headers: { Authorization: "Bearer " + authToken },
    contentType: "application/json",
    data: JSON.stringify(data),
    success: () => {
      alert("Review Posted!");
      $(`#${prefix}-txt-${pid}`).val("");
      $(`#${prefix}-rate-${pid}`).val("");
      if (isShopView) loadShopReviews(pid);
      else loadAdminReviews(pid);
    },
    error: (e) =>
      alert(e.responseJSON ? e.responseJSON.error : "Error posting review"),
  });
}

// --- HELPER FUNCTIONS ---
function fetchCategories() {
  $.get("/api/categories", function (cats) {
    categories = cats;
    let adminSelect = $("#prodCat");
    let shopSelect = $("#shopFilter");

    adminSelect.empty();
    shopSelect.html('<option value="All">All Categories</option>');

    cats.forEach((c) => {
      adminSelect.append(`<option value="${c.name}">${c.name}</option>`);
      shopSelect.append(`<option value="${c.name}">${c.name}</option>`);
    });
  });
}

function fetchRates() {
  $.get("/api/rates", function (rates) {
    exchangeRates = rates;
    let select = $("#currency-select");
    Object.keys(rates).forEach((c) => {
      if (c !== "SGD") select.append(`<option value="${c}">${c}</option>`);
    });
  });
}

function updateTotalCurrency() {
  let total = parseFloat($("#cart-total-sgd").text());
  let cur = $("#currency-select").val();
  let rate = exchangeRates[cur] || 1;
  $("#final-total").text((total * rate).toFixed(2));
  $("#currency-label").text(cur);
}
