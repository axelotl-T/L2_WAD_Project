// GLOBAL VARIABLES
$(document).ready(function () {
  if (!authToken) {
    alert("Access Denied");
    window.location.href = "/login.html";
    return;
  }

  // Bind Logout
  $("#btnLogout").click(function () {
    localStorage.clear();
    window.location.href = "/login.html";
  });

  // Load Initial Data
  loadProducts();
  fetchCategories();
  loadAllReviews(); // <--- NEW

  // Bind Product Save
  $("#btnSave").click(saveProduct);
});

// --- PRODUCT LOGIC (Existing) ---
async function loadProducts() {
  try {
    let response = await fetch("/api/products");
    let products = await response.json();
    $("#admin-products-list").empty();

    products.forEach((p) => {
      $("#admin-products-list").append(`
                <div class="card">
                    <h4>${p.name} ($${p.price})</h4>
                    <p>${p.description}</p>
                    <p>Cat: ${p.category} | Stock: ${p.stock}</p>
                    <button class="btn btn-warning" onclick="editProduct('${p._id}')">Edit</button>
                    <button class="btn btn-danger" onclick="deleteProduct('${p._id}')">Delete</button>
                </div>
            `);
    });
  } catch (e) {
    console.log(e);
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

  await fetch(url, {
    method: method,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + authToken,
    },
    body: JSON.stringify(data),
  });

  $("#product-form").slideUp();
  loadProducts();
  // Clear form
  $("#prodId").val("");
  $("#prodName").val("");
  $("#prodDesc").val("");
  $("#prodPrice").val("");
  $("#prodStock").val("");
}

async function deleteProduct(id) {
  if (confirm("Delete Product?")) {
    await fetch(`/api/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + authToken },
    });
    loadProducts();
  }
}

async function editProduct(id) {
  let res = await fetch(`/api/products/${id}`);
  let p = await res.json();
  $("#prodId").val(p._id);
  $("#prodName").val(p.name);
  $("#prodDesc").val(p.description);
  $("#prodPrice").val(p.price);
  $("#prodStock").val(p.stock);
  $("#prodCat").val(p.category);
  $("#product-form").slideDown();
}

async function fetchCategories() {
  let res = await fetch("/api/categories");
  let cats = await res.json();
  cats.forEach((c) =>
    $("#prodCat").append(`<option value="${c.name}">${c.name}</option>`),
  );
}

// --- NEW: REVIEW MANAGEMENT LOGIC ---

async function loadAllReviews() {
  try {
    let res = await fetch("/api/reviews");
    let reviews = await res.json();
    let container = $("#admin-reviews-list");
    container.empty();

    if (reviews.length === 0) {
      container.append("<p>No reviews found.</p>");
      return;
    }

    reviews.forEach((r) => {
      let productName = r.product ? r.product.name : "Unknown Product";
      let userName = r.user ? r.user.username : "Unknown User";

      container.append(`
                <div class="card" style="background:#fff3cd; border-color:#ffeeba;">
                    <h5>${productName} <small style="font-size:0.8em; color:grey">by ${userName}</small></h5>
                    <p><strong>Rating:</strong> ${r.rating}/5</p>
                    <p><strong>Comment:</strong> ${r.comment}</p>
                    
                    <div id="edit-review-${r._id}" style="display:none; margin-top:10px; padding-top:10px; border-top:1px solid #ddd;">
                         <input type="number" id="edit-rate-${r._id}" value="${r.rating}" min="1" max="5" style="width:60px">
                         <input type="text" id="edit-comm-${r._id}" value="${r.comment}" style="width:70%">
                         <button class="btn btn-sm btn-success" onclick="saveReview('${r._id}')">Save</button>
                         <button class="btn btn-sm btn-secondary" onclick="$('#edit-review-${r._id}').hide()">Cancel</button>
                    </div>

                    <div style="margin-top:10px;">
                        <button class="btn btn-sm btn-warning" onclick="$('#edit-review-${r._id}').toggle()">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="adminDeleteReview('${r._id}')">Delete</button>
                    </div>
                </div>
            `);
    });
  } catch (e) {
    console.log("Error loading reviews", e);
  }
}

async function adminDeleteReview(id) {
  if (!confirm("Are you sure you want to remove this review?")) return;

  try {
    let res = await fetch(`/api/reviews/${id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + authToken },
    });
    if (res.ok) {
      loadAllReviews();
    } else {
      alert("Failed to delete");
    }
  } catch (e) {
    console.log(e);
  }
}

async function saveReview(id) {
  let rating = $(`#edit-rate-${id}`).val();
  let comment = $(`#edit-comm-${id}`).val();

  try {
    let res = await fetch(`/api/reviews/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + authToken,
      },
      body: JSON.stringify({ rating, comment }),
    });

    if (res.ok) {
      loadAllReviews();
    } else {
      alert("Failed to update");
    }
  } catch (e) {
    console.log(e);
  }
}
