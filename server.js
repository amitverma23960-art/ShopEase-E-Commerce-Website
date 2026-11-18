const express = require("express");
const mongoose = require("mongoose");
const Product = require("./models/Product");
const Order = require("./models/Order");

const app = express();

app.use(express.json());
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/ecommerceDB")
    .then(() => console.log("MongoDB Connected Successfully!"))
    .catch(error => console.log("MongoDB Error:", error));

// Get products
app.get("/api/products", async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch products" });
    }
});

// Add product
app.post("/api/products", async (req, res) => {
    try {
        const product = await Product.create(req.body);
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ message: "Failed to add product" });
    }
});

// Update product
app.put("/api/products/:id", async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json(product);
    } catch (error) {
        res.status(400).json({ message: "Failed to update product" });
    }
});

// Delete product
app.delete("/api/products/:id", async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(400).json({ message: "Failed to delete product" });
    }
});

// Place order
app.post("/api/orders", async (req, res) => {
    try {
        const { customerName, email, address, items } = req.body;

        if (!customerName || !email || !address ||
            !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "Invalid order details" });
        }

        const productIds = items.map(item => item.productId);
        const products = await Product.find({ _id: { $in: productIds } });

        if (products.length !== items.length) {
            return res.status(400).json({ message: "Some products are unavailable" });
        }

        const orderItems = [];

        for (const item of items) {
            const product = products.find(
                p => p._id.toString() === item.productId
            );

            const quantity = Number(item.quantity);

            if (!product || !Number.isInteger(quantity) || quantity < 1) {
                return res.status(400).json({ message: "Invalid product quantity" });
            }

            if (product.stock < quantity) {
                return res.status(400).json({
                    message: `Insufficient stock for ${product.name}`
                });
            }

            orderItems.push({
                productId: product._id,
                name: product.name,
                price: product.price,
                quantity
            });
        }

        const totalAmount = orderItems.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );

        for (const item of orderItems) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: -item.quantity }
            });
        }

        const order = await Order.create({
            customerName,
            email,
            address,
            items: orderItems,
            totalAmount
        });

        res.status(201).json({
            message: "Order placed successfully!",
            order
        });

    } catch (error) {
        res.status(500).json({ message: "Failed to place order" });
    }
});

// Get all orders
app.get("/api/orders", async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch orders" });
    }
});

// Update order status
app.patch("/api/orders/:id/status", async (req, res) => {
    try {
        const allowedStatuses = ["Pending", "Shipped", "Delivered"];

        if (!allowedStatuses.includes(req.body.status)) {
            return res.status(400).json({ message: "Invalid order status" });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json({
            message: "Order status updated successfully",
            order
        });

    } catch (error) {
        res.status(400).json({ message: "Failed to update order status" });
    }
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});