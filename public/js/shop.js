$(document).ready(function () {
  loadShopProducts(); // Load all by default
  loadCategoriesForFilter(); // NEW: Populate the dropdown

  // Bind Category Change Event
  $("#categoryFilter").change(function () {
    let selectedCat = $(this).val();
    loadShopProducts(selectedCat);
  });
});

// --- 1. LOAD PRODUCTS (Handles Filter too) ---
async function loadShopProducts(category = "All") {
  try {
    // If specific category is chosen, append query param
    let url = "/api/products";
    if (category && category !== "All") {
      url += `?category=${encodeURIComponent(category)}`;
    }

    let res = await fetch(url);
    let products = await res.json();

    renderProducts(products);
  } catch (e) {
    console.log(e);
  }
}

// --- 2. HANDLE SEARCH ---
async function handleSearch() {
  let keyword = $("#searchInput").val();

  if (!keyword || keyword.trim() === "") {
    loadShopProducts(); // If empty, reload all
    return;
  }

  try {
    let res = await fetch("/api/products/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: keyword }),
    });

    let products = await res.json();
    renderProducts(products);

    // Reset category dropdown to "All" since search overrides it
    $("#categoryFilter").val("All");
  } catch (e) {
    console.log("Search error", e);
  }
}

// --- 3. HELPER: RENDER TO HTML ---
function renderProducts(products) {
  $("#shop-container").empty();

  if (products.length === 0) {
    $("#shop-container").html("<p>No products found.</p>");
    return;
  }

  products.forEach((p) => {
    $("#shop-container").append(`
                <div class="shop-card" style="border:1px solid #ddd; padding:10px; margin:5px; background:white;">
                    <h4>${p.name}</h4>
                    <p>${p.description}</p>
                    
                    <div class="price-tag">
                        <span class="price-display" data-val="${p.price}">SGD ${p.price}</span>
                    </div>

                    <button class="btn btn-primary" onclick="addToCart('${p._id}', '${p.name}', ${p.price})">Add to Cart</button>
                    <button class="btn btn-info" onclick="toggleReviews('${p._id}')">Reviews</button>

                    <div id="reviews-${p._id}" class="reviews-container" style="display:none; text-align:left; margin-top:10px; border-top:1px solid #eee; padding-top:10px;">
                    </div>
                </div>
            `);
  });

  // Initial currency update (if function exists from index.js)
  if (typeof updateAllPrices === "function") {
    updateAllPrices();
  }
}

// --- 4. LOAD CATEGORIES DROPDOWN ---
async function loadCategoriesForFilter() {
  try {
    let res = await fetch("/api/categories");
    let cats = await res.json();

    cats.forEach((c) => {
      $("#categoryFilter").append(
        `<option value="${c.name}">${c.name}</option>`,
      );
    });
  } catch (e) {
    console.log("Error loading categories", e);
  }
}

// --- 5. REVIEW LOGIC (Existing) ---
async function toggleReviews(productId) {
  let container = $(`#reviews-${productId}`);

  if (container.is(":visible")) {
    container.slideUp();
    return;
  }

  try {
    let res = await fetch(`/api/products/${productId}/reviews`);
    let reviews = await res.json();

    container.empty();

    if (authToken) {
      container.append(`
                <div class="review-form" style="margin-bottom:10px; padding-bottom:10px; border-bottom:1px dashed #ccc;">
                    <h6>Write a Review:</h6>
                    <select id="rate-${productId}" style="width:100%; margin-bottom:5px;">
                        <option value="5">5 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="2">2 Stars</option>
                        <option value="1">1 Star</option>
                    </select>
                    <textarea id="comm-${productId}" placeholder="Your comment..." style="width:100%; height:60px; margin-bottom:5px;"></textarea>
                    <button class="btn btn-sm btn-success" onclick="postReview('${productId}')">Submit Review</button>
                </div>
            `);
    } else {
      container.append(
        `<p style="font-size:0.9em; color:gray;"><em>Please <a href="/login.html">login</a> to write a review.</em></p>`,
      );
    }

    if (reviews.length === 0) {
      container.append("<p>No reviews yet.</p>");
    } else {
      reviews.forEach((r) => {
        let deleteBtn = "";
        if (authToken && r.user && r.user.username === currentUser) {
          deleteBtn = `<button class="btn btn-danger btn-sm" style="float:right; padding:0 5px;" onclick="deleteReview('${r._id}', '${productId}')">x</button>`;
        }

        container.append(`
                    <div class="shop-review-item" style="border-bottom:1px solid #eee; padding:5px 0; font-size:0.9em;">
                        ${deleteBtn}
                        <strong>${r.user ? r.user.username : "Unknown"}</strong> 
                        <span style="color:#ffc107;">${"★".repeat(r.rating)}</span>
                        <p style="margin:5px 0;">${r.comment}</p>
                    </div>
                `);
      });
    }

    container.slideDown();
  } catch (e) {
    console.log("Error loading reviews", e);
  }
}

async function postReview(productId) {
  let rating = $(`#rate-${productId}`).val();
  let comment = $(`#comm-${productId}`).val();

  if (!comment) {
    alert("Please write a comment.");
    return;
  }

  try {
    let res = await fetch("/api/reviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + authToken,
      },
      body: JSON.stringify({ productId, rating, comment }),
    });

    if (res.ok) {
      alert("Review submitted!");
      $(`#reviews-${productId}`).hide();
      toggleReviews(productId);
    } else {
      let err = await res.json();
      alert("Error: " + err.error);
    }
  } catch (e) {
    console.log(e);
  }
}

async function deleteReview(reviewId, productId) {
  if (!confirm("Are you sure you want to delete this review?")) return;

  try {
    let res = await fetch(`/api/reviews/${reviewId}`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + authToken,
      },
    });

    if (res.ok) {
      alert("Review deleted.");
      $(`#reviews-${productId}`).hide();
      toggleReviews(productId);
    } else {
      alert("Failed to delete review.");
    }
  } catch (e) {
    console.log(e);
  }
}
