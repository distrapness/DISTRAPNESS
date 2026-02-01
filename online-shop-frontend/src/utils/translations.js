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
            simplyBetter: "Simply Better",
            philosophyText: "Distrapness clothing is designed to make your everyday life better. Simple, high-quality, everyday clothing with a practical sense of beauty—ingenious in detail, thought through with life’s needs in mind, and always evolving.",
            viewAll: "View All Products",
            readMore: "Read Our Story",
            featured: "Featured Collection",
            shopNow: "Shop Now"
        },
        shop: {
            search: "Search Products...",
            filter: "Filter",
            lowStock: "Low Stock",
            outOfStock: "Out of Stock",
            addToCart: "Add to Bag"
        },
        newsletter: {
            title: "Newsletter",
            placeholder: "E-mail Address",
            subscribe: "Subscribe"
        },
        footer: {
            about: "About",
            ourStory: "Our Story",
            sustainability: "Sustainability",
            careers: "Careers",
            press: "Press",
            customerService: "Customer Service",
            contactUs: "Contact Us",
            shipping: "Shipping & Returns",
            orderStatus: "Order Status",
            sizeGuide: "Size Guide",
            legal: "Legal",
            terms: "Terms of Service",
            privacy: "Privacy Policy",
            cookie: "Cookie Policy",
            connect: "Connect",
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
            simplyBetter: "Lebih Baik",
            philosophyText: "Pakaian Distrapness dirancang untuk membuat kehidupan sehari-hari Anda lebih baik. Sederhana, berkualitas tinggi, pakaian sehari-hari dengan rasa keindahan praktis—cerdik dalam detail, dipikirkan dengan matang sesuai kebutuhan hidup, dan selalu berkembang.",
            viewAll: "Lihat Semua",
            readMore: "Baca Cerita",
            featured: "Koleksi Pilihan",
            shopNow: "Belanja Sekarang"
        },
        shop: {
            search: "Cari Produk...",
            filter: "Filter",
            lowStock: "Stok Menipis",
            outOfStock: "Stok Habis",
            addToCart: "Tambah ke Tas"
        },
        newsletter: {
            title: "Buletin",
            placeholder: "Alamat Email",
            subscribe: "Langganan"
        },
        footer: {
            about: "Tentang Kami",
            ourStory: "Cerita Kami",
            sustainability: "Keberlanjutan",
            careers: "Karir",
            press: "Pers",
            customerService: "Layanan Pelanggan",
            contactUs: "Hubungi Kami",
            shipping: "Pengiriman & Pengembalian",
            orderStatus: "Status Pesanan",
            sizeGuide: "Panduan Ukuran",
            legal: "Hukum",
            terms: "Syarat Layanan",
            privacy: "Kebijakan Privasi",
            cookie: "Kebijakan Cookie",
            connect: "Hubungi",
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
