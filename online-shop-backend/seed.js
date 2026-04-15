const pool = require('./db');

const seedData = async () => {
    try {
        console.log("Seeding fashion data...");

        // Ensure columns exist (Migration)
        try { await pool.promise().query("ALTER TABLE products ADD COLUMN sizes TEXT"); } catch (e) { }
        try { await pool.promise().query("ALTER TABLE products ADD COLUMN category VARCHAR(100)"); } catch (e) { }

        // 1. Categories
        const categories = [
            { name: "Men's Apparel", slug: "men", image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=600" },
            { name: "Women's Fashion", slug: "women", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=600" },
            { name: "Streetwear", slug: "streetwear", image: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=600" },
            { name: "Footwear", slug: "footwear", image: "https://images.unsplash.com/photo-1560769629-975e13b51e67?auto=format&fit=crop&q=80&w=600" },
            { name: "Accessories", slug: "accessories", image: "https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?auto=format&fit=crop&q=80&w=600" }
        ];

        for (const cat of categories) {
            const [exists] = await pool.promise().query('SELECT id FROM categories WHERE slug = ?', [cat.slug]);
            if (exists.length === 0) {
                await pool.promise().query('INSERT INTO categories (name, slug, image) VALUES (?, ?, ?)', [cat.name, cat.slug, cat.image]);
                console.log(`Created category: ${cat.name}`);
            }
        }

        // 2. Products
        const products = [
            {
                name: "Oversized Street Tee Black",
                price: 189000,
                description: "Heavyweight cotton oversized t-shirt with drop shoulders. Perfect for street style.",
                stock: 50,
                sizes: { S: 10, M: 20, L: 15, XL: 5 },
                category: "Streetwear",
                images: [
                    "https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&q=80&w=800",
                    "https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&q=80&w=800"
                ]
            },
            {
                name: "Vintage Denim Jacket",
                price: 499000,
                description: "Classic blue denim jacket with distressed details. A timeless wardrobe essential.",
                stock: 25,
                sizes: { S: 5, M: 10, L: 8, XL: 2 },
                category: "Men's Apparel",
                images: [
                    "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&q=80&w=800",
                    "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&q=80&w=800"
                ]
            },
            {
                name: "Floral Summer Dress",
                price: 325000,
                description: "Lightweight and breezy floral dress for summer days. Sustainable fabric.",
                stock: 30,
                sizes: { S: 10, M: 10, L: 10, XL: 0 },
                category: "Women's Fashion",
                images: [
                    "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=800",
                    "https://images.unsplash.com/photo-1572804013427-4d7ca7268217?auto=format&fit=crop&q=80&w=800"
                ]
            },
            {
                name: "Cargo Pants Techwear",
                price: 350000,
                description: "Functional cargo pants with multiple pockets and durable fabric.",
                stock: 40,
                sizes: { S: 10, M: 15, L: 10, XL: 5 },
                category: "Streetwear",
                images: [
                    "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=800"
                ]
            },
            {
                name: "White Leather Sneakers",
                price: 899000,
                description: "Minimalist white leather sneakers. High quality material for daily comfort.",
                stock: 20,
                sizes: { S: 0, M: 10, L: 5, XL: 5 }, // Mapping S/M/L to Shoe sizes conceptually 40-44
                category: "Footwear",
                images: [
                    "https://images.unsplash.com/photo-1560769629-975e13b51e67?auto=format&fit=crop&q=80&w=800"
                ]
            },
            {
                name: "Distressed Skinny Jeans",
                price: 299000,
                description: "High stretch skinny jeans with knee rips.",
                stock: 35,
                sizes: { S: 10, M: 10, L: 10, XL: 5 },
                category: "Men's Apparel",
                images: [
                    "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?auto=format&fit=crop&q=80&w=800"
                ]
            },
            {
                name: "Silk Scarf Patterned",
                price: 120000,
                description: "Elegant silk scarf to accessorize any outfit.",
                stock: 100,
                sizes: { S: 100, M: 0, L: 0, XL: 0 }, // Free size mapped to S
                category: "Accessories",
                images: [
                    "https://images.unsplash.com/photo-1584030373081-f37b7bb4fa8e?auto=format&fit=crop&q=80&w=800"
                ]
            },
            {
                name: "Hoodie Essentials Grey",
                price: 450000,
                description: "Premium heavy cotton hoodie in heather grey.",
                stock: 60,
                sizes: { S: 15, M: 20, L: 20, XL: 5 },
                category: "Streetwear",
                images: [
                    "https://images.unsplash.com/photo-1556906781-9a412961d28c?auto=format&fit=crop&q=80&w=800"
                ]
            }
        ];

        for (const prod of products) {
            // Check if exact name exists
            const [exists] = await pool.promise().query('SELECT id FROM products WHERE name = ?', [prod.name]);
            if (exists.length === 0) {
                await pool.promise().query(
                    'INSERT INTO products (name, price, description, stock, sizes, category, images) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [prod.name, prod.price, prod.description, prod.stock, JSON.stringify(prod.sizes), prod.category, JSON.stringify(prod.images)]
                );
                console.log(`Created product: ${prod.name}`);
            }
        }

        console.log("Seeding completed successfully.");
        process.exit(0);

    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
};

seedData();
