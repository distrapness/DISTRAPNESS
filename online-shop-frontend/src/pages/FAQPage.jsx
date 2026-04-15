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
                            <h3 className="text-base font-bold uppercase tracking-wide mb-2 text-black dark:text-white flex items-center gap-2">
                                <span className="text-red-500">Q.</span> {f.q}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm md:text-base ml-6">{f.a}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center bg-black dark:bg-white text-white dark:text-black py-10 px-4 rounded-xl mx-4 md:mx-0">
                    <h3 className="text-xl font-bold uppercase tracking-wide mb-2">Still have questions?</h3>
                    <p className="text-sm opacity-80 mb-6">Can't find the answer you're looking for? Please chat to our friendly team.</p>
                    <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer" className="inline-block bg-[#25D366] text-white px-8 py-3 rounded-full font-bold uppercase text-xs tracking-widest hover:opacity-90 transition-opacity">
                        Chat on WhatsApp
                    </a>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default FAQPage;
