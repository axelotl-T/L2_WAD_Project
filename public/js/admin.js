$(document).ready(function () {
  if (!authToken) {
    alert("Access Denied");
    window.location.href = "/login.html";
    return;
  }

  loadProducts();
  fetchCategories();
  $("#btnSave").click(saveProduct);
});

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
}

async function deleteProduct(id) {
  if (confirm("Delete?")) {
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
