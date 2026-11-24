const mongoose = require("mongoose");
const Product = require("./models/Product");

const products = [
    {
        name: "Classic Sneakers",
        description: "Comfortable everyday sneakers.",
        price: 2499,
        category: "Fashion",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
        stock: 15
    },
    {
        name: "Wireless Headphones",
        description: "Premium sound with comfortable design.",
        price: 1999,
        category: "Electronics",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
        stock: 12
    },
    {
        name: "Smart Watch",
        description: "Modern smartwatch for everyday use.",
        price: 3499,
        category: "Accessories",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
        stock: 10
    },
    {
        name: "Travel Backpack",
        description: "Spacious backpack for travel and daily use.",
        price: 1599,
        category: "Fashion",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
        stock: 20
    },
    {
        name: "Modern Lamp",
        description: "Stylish lamp for your home and workspace.",
        price: 1299,
        category: "Home",
        image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80",
        stock: 8
    },
    {
        name: "Wireless Earbuds",
        description: "Compact wireless earbuds with clear audio.",
        price: 1799,
        category: "Electronics",
        image: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=600&q=80",
        stock: 18
    },
    {
        name: "Sunglasses",
        description: "Classic sunglasses for everyday style.",
        price: 999,
        category: "Accessories",
        image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80",
        stock: 25
    },
    {
        name: "Desk Organizer",
        description: "Keep your workspace clean and organized.",
        price: 799,
        category: "Home",
        image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=600&q=80",
        stock: 14
    }
];

async function seedProducts() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI environment variable is missing");
        }

        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB Atlas Connected!");

        for (const product of products) {
            await Product.updateOne(
                { name: product.name },
                { $set: product },
                { upsert: true }
            );
        }

        console.log("8 products added/updated successfully!");
    } catch (error) {
        console.error("Seed Error:", error.message);
    } finally {
        await mongoose.disconnect();
        console.log("Database connection closed.");
    }
}

seedProducts();