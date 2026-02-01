export const translations = {
    EN: {
        nav: {
            home: "Home",
            shop: "Shop",
            store: "Store",
            about: "About",
            contact: "Contact",
            signin: "Sign in",
            register: "Register",
            signout: "Sign out",
            profile: "Profile"
        },
        home: {
            newArrivals: "New Arrivals",
            shopCategory: "Shop By Category",
            philosophy: "Our Philosophy",
            viewAll: "View All Products",
            readMore: "Read Our Story",
            featured: "Featured Collection"
        },
        shop: {
            search: "Search Products...",
            filter: "Filter",
            lowStock: "Low Stock",
            outOfStock: "Out of Stock",
            addToCart: "Add to Bag"
        },
        footer: {
            about: "About",
            customerService: "Customer Service",
            legal: "Legal",
            connect: "Connect",
            newsletter: "Newsletter",
            subscribe: "Subscribe",
            rights: "All Rights Reserved"
        }
    },
    ID: {
        nav: {
            home: "Beranda",
            shop: "Belanja",
            store: "Toko",
            about: "Tentang",
            contact: "Kontak",
            signin: "Masuk",
            register: "Daftar",
            signout: "Keluar",
            profile: "Profil"
        },
        home: {
            newArrivals: "Terbaru",
            shopCategory: "Belanja Kategori",
            philosophy: "Filosofi Kami",
            viewAll: "Lihat Semua",
            readMore: "Baca Cerita",
            featured: "Koleksi Pilihan"
        },
        shop: {
            search: "Cari Produk...",
            filter: "Filter",
            lowStock: "Stok Menipis",
            outOfStock: "Stok Habis",
            addToCart: "Tambah ke Tas"
        },
        footer: {
            about: "Tentang Kami",
            customerService: "Layanan Pelanggan",
            legal: "Hukum",
            connect: "Hubungi",
            newsletter: "Berlangganan",
            subscribe: "Daftar",
            rights: "Hak Cipta Dilindungi"
        }
    }
};

export const getTranslation = (lang, path) => {
    const keys = path.split('.');
    let current = translations[lang] || translations['EN'];
    for (const key of keys) {
        if (current[key] === undefined) return path;
        current = current[key];
    }
    return current;
};
