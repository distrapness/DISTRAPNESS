import React from "react";
import { useCurrency } from "../components/CurrencyContext.jsx";
import Footer from "../components/Footer.jsx";

const HowToOrder = () => {
    const { t, language } = useCurrency();
    const isId = language !== 'EN';

    const steps = isId ? [
        {
            num: "01",
            title: "Pilih Produk",
            desc: "Jelajahi koleksi premium kami dan pilih produk yang sesuai dengan gaya Anda. Pilih ukuran dan jumlah."
        },
        {
            num: "02",
            title: "Tambah ke Keranjang",
            desc: "Masukkan pilihan Anda ke keranjang belanja. Anda dapat meninjau kembali dan menyesuaikan pilihan Anda di laci keranjang belanja."
        },
        {
            num: "03",
            title: "Checkout Aman",
            desc: "Lengkapi detail pengiriman Anda dan pilih metode pembayaran yang Anda inginkan (Transfer Bank, QRIS, atau COD)."
        },
        {
            num: "04",
            title: "Pengiriman Premium",
            desc: "Setelah pembayaran diverifikasi, kami akan memproses pesanan Anda dengan hati-hati. Lacak pengiriman Anda langsung dari halaman profil."
        }
    ] : [
        {
            num: "01",
            title: "Select Products",
            desc: "Browse our premium collection and choose the items that match your style. Select size and quantity."
        },
        {
            num: "02",
            title: "Add to Cart",
            desc: "Add your selection to the cart. You can review and adjust your choices in the Cart Drawer."
        },
        {
            num: "03",
            title: "Secure Checkout",
            desc: "Fill in your shipping details and choose from our preferred payment methods (Bank Transfer, QRIS, or COD)."
        },
        {
            num: "04",
            title: "Premium Delivery",
            desc: "Once payment is verified, we process your order with care. Track your shipment directly from your profile account."
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-955 pt-4 md:pt-6 transition-colors duration-500">
            <div className="max-w-5xl mx-auto px-6 pb-24">
                <header className="text-center mb-20">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-4 block italic">{isId ? "Panduan" : "Guide"}</span>
                    <h1 className="text-4xl md:text-6xl font-[900] text-black dark:text-white uppercase tracking-tighter italic mb-6">{isId ? "Cara Pemesanan" : "How to Order"}</h1>
                    <div className="w-20 h-1 bg-black dark:bg-white mx-auto"></div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {steps.map((step, i) => (
                        <div key={i} className="bg-white dark:bg-gray-900 p-10 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl hover:scale-[1.02] transition-all group">
                            <div className="text-5xl font-black text-gray-100 dark:text-gray-800 mb-6 group-hover:text-black dark:group-hover:text-white transition-colors duration-500 font-mono italic">
                                {step.num}
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-4 text-black dark:text-white">
                                {step.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-loose tracking-wide">
                                {step.desc}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-20 text-center bg-black dark:bg-white text-white dark:text-black p-16 rounded-[40px] shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 dark:bg-black/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                   <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-4 relative z-10">{isId ? "Siap untuk mulai berbelanja?" : "Ready to start shopping?"}</h2>
                   <p className="text-sm opacity-60 mb-10 max-w-sm mx-auto relative z-10">{isId ? "Temukan koleksi terbaru kami dan tingkatkan gaya hidup harian Anda dengan Distrapness." : "Discover our latest collection and elevate your daily lifestyle with Distrapness."}</p>
                   <a href="/shop" className="inline-block bg-white dark:bg-black text-black dark:text-white px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:scale-110 active:scale-95 transition-all relative z-10">
                       {isId ? "Jelajahi Koleksi →" : "Browse Collection →"}
                   </a>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default HowToOrder;
