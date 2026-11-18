let products = [];
let cart = [];
let ordersData = [];
let selectedCategory = "All";

const productContainer = document.getElementById("productContainer");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const cartBtn = document.getElementById("cartBtn");
const cartSection = document.getElementById("cartSection");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const cartCount = document.getElementById("cartCount");
const checkoutBtn = document.getElementById("checkoutBtn");
const checkoutSection = document.getElementById("checkoutSection");
const checkoutForm = document.getElementById("checkoutForm");
const orderList = document.getElementById("orderList");

// Load products
async function loadProducts() {
    try {
        const response = await fetch("/api/products");

        if (!response.ok) throw new Error("Failed to load products");

        products = await response.json();
        renderProducts();
        renderAdminProducts();
        renderDashboard();
    } catch (error) {
        productContainer.innerHTML = "<p>Unable to load products.</p>";
    }
}

// Dashboard
function renderDashboard() {
    document.getElementById("totalProducts").textContent = products.length;
    document.getElementById("totalOrders").textContent = ordersData.length;

    const revenue = ordersData.reduce(
        (total, order) => total + Number(order.totalAmount || 0),
        0
    );

    document.getElementById("totalRevenue").textContent =
        "₹" + revenue.toLocaleString("en-IN");

    const pending = ordersData.filter(
        order => order.status === "Pending"
    ).length;

    document.getElementById("pendingOrders").textContent = pending;
}

// Render products
function renderProducts() {
    let filteredProducts = [...products];

    if (selectedCategory !== "All") {
        filteredProducts = filteredProducts.filter(
            product => product.category === selectedCategory
        );
    }

    const searchTerm = searchInput.value.toLowerCase();

    filteredProducts = filteredProducts.filter(
        product => product.name.toLowerCase().includes(searchTerm)
    );

    if (sortSelect.value === "low") {
        filteredProducts.sort((a, b) => a.price - b.price);
    }

    if (sortSelect.value === "high") {
        filteredProducts.sort((a, b) => b.price - a.price);
    }

    productContainer.innerHTML = filteredProducts.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}">
            <div class="product-info">
                <span class="product-category">${product.category}</span>
                <h3>${product.name}</h3>
                <p class="product-price">₹${product.price}</p>
                <p>Stock: ${product.stock}</p>
                <button class="add-btn" data-id="${product._id}"
                    ${product.stock <= 0 ? "disabled" : ""}>
                    ${product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                </button>
            </div>
        </div>
    `).join("");
}

// Admin product list
function renderAdminProducts() {
    const adminProductList = document.getElementById("adminProductList");

    adminProductList.innerHTML = products.map(product => `
        <div class="admin-product-item">
            <span>${product.name} - ₹${product.price}</span>
            <button class="admin-edit-btn" data-id="${product._id}">
                Edit
            </button>
            <button class="admin-delete-btn" data-id="${product._id}">
                Delete
            </button>
        </div>
    `).join("");
}

// Add to cart
function addToCart(id) {
    const product = products.find(item => item._id === id);

    if (!product || product.stock <= 0) {
        alert("This product is unavailable!");
        return;
    }

    const cartProduct = cart.find(item => item._id === id);

    if (cartProduct) {
        if (cartProduct.quantity >= product.stock) {
            alert("Available stock limit reached!");
            return;
        }

        cartProduct.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    renderCart();
}

// Remove cart item
function removeFromCart(id) {
    cart = cart.filter(item => item._id !== id);
    renderCart();
}

// Render cart
function renderCart() {
    cartCount.textContent = cart.reduce(
        (total, item) => total + item.quantity, 0
    );

    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div>
                <h4>${item.name}</h4>
                <p>₹${item.price} × ${item.quantity}</p>
            </div>
            <button class="remove-btn" data-id="${item._id}">
                Remove
            </button>
        </div>
    `).join("");

    const total = cart.reduce(
        (sum, item) => sum + item.price * item.quantity, 0
    );

    cartTotal.textContent = total;
}

// Categories
document.getElementById("categoryContainer").addEventListener("click", event => {
    const button = event.target.closest(".category-card");

    if (!button) return;

    document.querySelectorAll(".category-card").forEach(card => {
        card.classList.remove("active");
    });

    button.classList.add("active");
    selectedCategory = button.dataset.category;
    renderProducts();
});

// Search and sort
searchInput.addEventListener("input", renderProducts);
sortSelect.addEventListener("change", renderProducts);

// Add to cart click
productContainer.addEventListener("click", event => {
    const button = event.target.closest(".add-btn");

    if (button) addToCart(button.dataset.id);
});

// Remove cart item click
cartItems.addEventListener("click", event => {
    const button = event.target.closest(".remove-btn");

    if (button) removeFromCart(button.dataset.id);
});

// Toggle cart
cartBtn.addEventListener("click", () => {
    cartSection.hidden = !cartSection.hidden;

    if (!cartSection.hidden) {
        cartSection.scrollIntoView({ behavior: "smooth" });
    }
});

// Open checkout
checkoutBtn.addEventListener("click", () => {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    checkoutSection.hidden = false;
    checkoutSection.scrollIntoView({ behavior: "smooth" });
});

// Cancel checkout
document.getElementById("cancelCheckoutBtn").addEventListener("click", () => {
    checkoutSection.hidden = true;
});

// Place order
checkoutForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const orderData = {
        customerName: document.getElementById("customerName").value.trim(),
        email: document.getElementById("customerEmail").value.trim(),
        address: document.getElementById("customerAddress").value.trim(),
        items: cart.map(item => ({
            productId: item._id,
            quantity: item.quantity
        }))
    };

    try {
        const response = await fetch("/api/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Order failed");
        }

        alert(
            "Order placed successfully!\n\nOrder ID: " +
            result.order._id + "\nTotal Amount: ₹" +
            result.order.totalAmount
        );

        cart = [];
        renderCart();
        checkoutForm.reset();
        checkoutSection.hidden = true;
        cartSection.hidden = true;

        await loadProducts();
        await loadOrders();

        document.getElementById("products").scrollIntoView({
            behavior: "smooth"
        });

    } catch (error) {
        alert(error.message || "Unable to place order!");
    }
});

// Delete product
document.getElementById("adminProductList").addEventListener("click", async event => {
    const button = event.target.closest(".admin-delete-btn");

    if (!button) return;

    const id = button.dataset.id;

    if (!confirm("Are you sure you want to delete this product?")) {
        return;
    }

    try {
        const response = await fetch(`/api/products/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) throw new Error("Delete failed");

        cart = cart.filter(item => item._id !== id);
        renderCart();

        await loadProducts();
        alert("Product deleted successfully!");

    } catch (error) {
        alert("Unable to delete product!");
    }
});

// Edit product
document.getElementById("adminProductList").addEventListener("click", event => {
    const button = event.target.closest(".admin-edit-btn");

    if (!button) return;

    const product = products.find(item => item._id === button.dataset.id);

    if (!product) return;

    document.getElementById("editProductSection").hidden = false;
    document.getElementById("editProductId").value = product._id;
    document.getElementById("editProductName").value = product.name;
    document.getElementById("editProductDescription").value = product.description;
    document.getElementById("editProductPrice").value = product.price;
    document.getElementById("editProductCategory").value = product.category;
    document.getElementById("editProductImage").value = product.image;
    document.getElementById("editProductStock").value = product.stock;

    document.getElementById("editProductSection").scrollIntoView({
        behavior: "smooth"
    });
});

// Update product
document.getElementById("editProductForm").addEventListener("submit", async event => {
    event.preventDefault();

    const id = document.getElementById("editProductId").value;

    const updatedProduct = {
        name: document.getElementById("editProductName").value.trim(),
        description: document.getElementById("editProductDescription").value.trim(),
        price: Number(document.getElementById("editProductPrice").value),
        category: document.getElementById("editProductCategory").value.trim(),
        image: document.getElementById("editProductImage").value.trim(),
        stock: Number(document.getElementById("editProductStock").value)
    };

    try {
        const response = await fetch(`/api/products/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedProduct)
        });

        if (!response.ok) throw new Error("Update failed");

        document.getElementById("editProductSection").hidden = true;
        document.getElementById("editProductForm").reset();

        await loadProducts();
        alert("Product updated successfully!");

    } catch (error) {
        alert("Unable to update product!");
    }
});

// Cancel edit
document.getElementById("cancelEditBtn").addEventListener("click", () => {
    document.getElementById("editProductSection").hidden = true;
    document.getElementById("editProductForm").reset();
});

// Add product
const productForm = document.getElementById("productForm");

productForm.addEventListener("submit", async event => {
    event.preventDefault();

    const newProduct = {
        name: document.getElementById("productName").value.trim(),
        description: document.getElementById("productDescription").value.trim(),
        price: Number(document.getElementById("productPrice").value),
        category: document.getElementById("productCategory").value.trim(),
        image: document.getElementById("productImage").value.trim(),
        stock: Number(document.getElementById("productStock").value)
    };

    try {
        const response = await fetch("/api/products", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newProduct)
        });

        if (!response.ok) throw new Error("Product could not be added");

        productForm.reset();
        await loadProducts();
        alert("Product added successfully!");

    } catch (error) {
        alert("Unable to add product!");
    }
});

// Load orders
async function loadOrders() {
    try {
        const response = await fetch("/api/orders");

        if (!response.ok) throw new Error("Failed to load orders");

        ordersData = await response.json();
        renderDashboard();

        if (ordersData.length === 0) {
            orderList.innerHTML = "<p>No orders found.</p>";
            return;
        }

        orderList.innerHTML = ordersData.map(order => `
            <div class="order-card">
                <h3>Order #${order._id}</h3>
                <p><strong>Customer:</strong> ${order.customerName}</p>
                <p><strong>Email:</strong> ${order.email}</p>
                <p><strong>Address:</strong> ${order.address}</p>
                <p><strong>Total:</strong> ₹${order.totalAmount}</p>
                <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>

                <h4>Items:</h4>
                <ul>
                    ${order.items.map(item => `
                        <li>${item.name} — ${item.quantity} × ₹${item.price}</li>
                    `).join("")}
                </ul>

                <p><strong>Status:</strong> ${order.status}</p>

                <div class="order-status-controls">
                    <select class="order-status-select" data-id="${order._id}">
                        <option value="Pending" ${order.status === "Pending" ? "selected" : ""}>Pending</option>
                        <option value="Shipped" ${order.status === "Shipped" ? "selected" : ""}>Shipped</option>
                        <option value="Delivered" ${order.status === "Delivered" ? "selected" : ""}>Delivered</option>
                    </select>

                    <button class="update-order-btn shop-btn" data-id="${order._id}">
                        Update Status
                    </button>
                </div>
            </div>
        `).join("");

    } catch (error) {
        orderList.innerHTML = "<p>Unable to load orders.</p>";
    }
}

// Update order status
orderList.addEventListener("click", async event => {
    const button = event.target.closest(".update-order-btn");

    if (!button) return;

    const id = button.dataset.id;
    const select = orderList.querySelector(
        `.order-status-select[data-id="${id}"]`
    );

    const status = select.value;

    try {
        const response = await fetch(`/api/orders/${id}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Status update failed");
        }

        alert("Order status updated successfully!");
        await loadOrders();

    } catch (error) {
        alert(error.message || "Unable to update order status!");
    }
});

// Refresh orders
document.getElementById("refreshOrdersBtn").addEventListener("click", loadOrders);

// Initial loading
loadProducts();
renderCart();
loadOrders();