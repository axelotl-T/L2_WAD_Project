$(document).ready(function () {
  loadShopProducts();
});

async function loadShopProducts() {
  try {
    let res = await fetch("/api/products");
    let products = await res.json();

    products.forEach((p) => {
      // NEW: Added 'price-display' class and 'data-val' attribute for currency conversion
      $("#shop-container").append(`
                <div class="shop-card" style="border:1px solid #ddd; padding:10px; margin:5px; background:white;">
                    <h4>${p.name}</h4>
                    <p>${p.description}</p>
                    <div class="price-tag">
                        <span class="price-display" data-val="${p.price}">SGD ${p.price}</span>
                    </div>
                    <button class="btn btn-primary" onclick="addToCart('${p._id}', '${p.name}', ${p.price})">Add to Cart</button>
                </div>
            `);
    });

    // Trigger an initial update in case user changed currency before products loaded
    if (typeof updateAllPrices === "function") {
      updateAllPrices();
    }
  } catch (e) {
    console.log(e);
  }
}
