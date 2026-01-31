$(document).ready(function () {
  loadShopProducts();
});

async function loadShopProducts() {
  try {
    let res = await fetch("/api/products");
    let products = await res.json();

    products.forEach((p) => {
      $("#shop-container").append(`
                <div class="shop-card" style="border:1px solid #ddd; padding:10px; margin:5px; background:white;">
                    <h4>${p.name}</h4>
                    <p>${p.description}</p>
                    <div class="price-tag">$${p.price}</div>
                    <button class="btn btn-primary" onclick="addToCart('${p._id}', '${p.name}', ${p.price})">Add to Cart</button>
                </div>
            `);
    });
  } catch (e) {
    console.log(e);
  }
}
