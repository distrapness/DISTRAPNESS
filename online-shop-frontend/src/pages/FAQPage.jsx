import React from 'react';
import Footer from '../components/Footer';

const faqs = [
    { q: "How do I place an order?", a: "Simply browse our shop, add items to your cart, and proceed to checkout. You can pay via Bank Transfer, QRIS, or COD." },
    { q: "What are the shipping costs?", a: "Shipping is calculated based on your location. We offer free shipping for orders over Rp 300.000." },
    { q: "Can I return a product?", a: "Yes, we accept returns within 7 days if the product is unused and has original tags. Please contact support via WhatsApp to initiate a return." },
    { q: "Is my payment secure?", a: "Absolutely. We use Midtrans, a trusted payment gateway in Indonesia, ensuring your data is encrypted and safe." },
    { q: "How do I track my order?", a: "You can track your order in the 'My Account' section under 'Order History'. You will also receive email updates." },
    { q: "Do you ship internationally?", a: "Currently, we only ship within Indonesia." },
];

const FAQPage = () => {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 pt-[100px] transition-colors duration-500">
            <div className="max-w-4xl mx-auto px-6 pb-20">
                <h1 className="text-3xl md:text-4xl font-[900] uppercase tracking-tighter mb-4 text-center text-black dark:text-white">Help Center</h1>
                <p className="text-center text-gray-500 mb-12 max-w-lg mx-auto">Everything you need to know about our products and billing.</p>

                <div className="space-y-4">
                    {faqs.map((f, i) => (
                        <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 hover:shadow-sm transition-shadow">
                            <h3 className="text-sm font-black uppercase tracking-widest mb-3 text-black dark:text-white flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-[10px]">Q</span> {f.q}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm md:text-base ml-6">{f.a}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-20 text-center bg-gray-50 dark:bg-gray-800 p-12 rounded-3xl border border-gray-100 dark:border-gray-700">
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-4 text-black dark:text-white">Still have questions?</h3>
                    <p className="text-sm text-gray-500 mb-10 max-w-sm mx-auto">Can't find the answer you're looking for? Reach out to our dedicated support team.</p>
                    <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer" className="inline-block bg-black dark:bg-white text-white dark:text-black px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:scale-105 transition-all">
                        Chat on WhatsApp →
                    </a>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default FAQPage;
