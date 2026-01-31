$(document).ready(function () {
  loadShopProducts();
});

async function loadShopProducts() {
  try {
    let res = await fetch("/api/products");
    let products = await res.json();

    products.forEach((p) => {
      // 1. We keep the currency logic (price-display)
      // 2. We add the Reviews Section (hidden by default)
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

    // Initial currency update
    if (typeof updateAllPrices === "function") {
      updateAllPrices();
    }
  } catch (e) {
    console.log(e);
  }
}

// --- REVIEW LOGIC ---

async function toggleReviews(productId) {
  let container = $(`#reviews-${productId}`);

  // Toggle Hide/Show
  if (container.is(":visible")) {
    container.slideUp();
    return;
  }

  // Fetch Reviews from Backend
  try {
    let res = await fetch(`/api/products/${productId}/reviews`);
    let reviews = await res.json();

    container.empty();

    // 1. Show "Add Review" Form (Only if Logged In)
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

    // 2. List Existing Reviews
    if (reviews.length === 0) {
      container.append("<p>No reviews yet.</p>");
    } else {
      reviews.forEach((r) => {
        let deleteBtn = "";
        // Show delete button ONLY if the logged-in user owns this review
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
      // Refresh the reviews section
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
      // Refresh the reviews section
      $(`#reviews-${productId}`).hide();
      toggleReviews(productId);
    } else {
      alert("Failed to delete review.");
    }
  } catch (e) {
    console.log(e);
  }
}
