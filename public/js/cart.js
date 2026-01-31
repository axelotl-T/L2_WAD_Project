// GLOBAL VARIABLES
const token = localStorage.getItem("token");

$(document).ready(function () {
  if (!token) {
    alert("Please login to view your cart.");
    window.location.href = "/login.html";
    return;
  }

  // 1. Load Data
  loadCartItems();
  loadUserInfo();

  // 2. Bind Events
  $("#btnCheckout").click(handleCheckout);

  // 3. Ensure currency updates if the selector is changed
  $("#currencySelect").change(function () {
    updateAllPrices();
  });
});

// --- USER INFO LOGIC ---
async function loadUserInfo() {
  try {
    let response = await fetch("/api/user", {
      headers: { Authorization: "Bearer " + token },
    });

    if (response.ok) {
      let user = await response.json();
      $("#ship-name").text(user.username);
      $("#ship-email").text(user.email);

      if (user.address) {
        $("#ship-postal").text(user.address.postalCode);
        let fullAddr = `${user.address.streetName}, ${user.address.building}`;
        $("#ship-address").text(fullAddr);
      } else {
        $("#ship-address").text("No address provided");
      }
      $("#shipping-info").show();
    }
  } catch (e) {
    console.log("Error loading user info", e);
  }
}

// --- CART DISPLAY LOGIC ---
function loadCartItems() {
  let cart = getCart();
  let container = $("#cart-items");
  let total = 0;

  container.empty();

  if (cart.length === 0) {
    container.html("<p>Your cart is empty.</p>");
    $("#total-price").attr("data-val", 0).text("SGD 0.00");
    return;
  }

  cart.forEach((item) => {
    let itemTotal = item.price * item.qty;
    total += itemTotal;

    // NEW: Added (-) and (+) buttons around the quantity
    container.append(`
        <div class="cart-item" style="border-bottom: 1px solid #eee; padding: 15px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h4 style="margin: 0;">${item.name}</h4>
                <p style="margin: 5px 0;">
                   Unit Price: <span class="price-display" data-val="${item.price}">SGD ${item.price}</span>
                </p>
            </div>
            <div style="text-align: right;">
                
                <div style="margin-bottom: 5px;">
                    <button class="btn btn-secondary btn-sm" onclick="changeQty('${item.id}', -1)">-</button>
                    <span class="qty-val" style="margin: 0 10px; font-weight:bold;">${item.qty}</span>
                    <button class="btn btn-secondary btn-sm" onclick="changeQty('${item.id}', 1)">+</button>
                </div>

                <p>
                   <strong>Subtotal: <span class="price-display" data-val="${itemTotal}">SGD ${itemTotal.toFixed(2)}</span></strong>
                </p>
                <button class="btn btn-danger btn-sm" onclick="removeFromCart('${item.id}')">Remove</button>
            </div>
        </div>
    `);
  });

  // Update Total Price
  $("#total-price").attr("data-val", total.toFixed(2));

  // Trigger currency conversion
  if (typeof updateAllPrices === "function") {
    updateAllPrices();
  }
}

// --- NEW: Function to Handle Quantity Changes ---
function changeQty(id, change) {
  let cart = getCart();
  let item = cart.find((i) => i.id === id);

  if (item) {
    item.qty += change;

    // Prevent quantity from dropping below 1 (Use remove button for that)
    if (item.qty < 1) {
      item.qty = 1;
    }

    saveCart(cart); // Save to LocalStorage
    loadCartItems(); // Re-render the list
  }
}

function removeFromCart(id) {
  let cart = getCart();
  let newCart = cart.filter((item) => item.id !== id);
  saveCart(newCart);
  loadCartItems();
}

async function handleCheckout() {
  let cart = getCart();
  if (cart.length === 0) {
    alert("Cart is empty!");
    return;
  }

  try {
    let response = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ cart: cart }),
    });

    if (response.ok) {
      alert("Checkout Successful! Check your email.");
      localStorage.removeItem("cart");
      window.location.href = "/index.html";
    } else {
      let err = await response.json();
      alert("Checkout Failed: " + err.error);
    }
  } catch (e) {
    console.log(e);
    alert("Error processing checkout");
  }
}
