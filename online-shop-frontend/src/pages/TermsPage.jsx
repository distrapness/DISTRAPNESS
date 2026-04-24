import React from "react";
import Footer from "../components/Footer";

const TermsPage = () => {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 pt-[100px] pb-12 transition-colors duration-500">
            <div className="max-w-4xl mx-auto px-6">
                <h1 className="text-3xl font-[900] uppercase tracking-wider mb-8 text-black dark:text-white text-center">Terms and Conditions</h1>

                <div className="text-gray-500 dark:text-gray-400 space-y-8 leading-loose text-sm tracking-wide">
                    <p className="italic font-medium text-gray-900 dark:text-white border-l-4 border-black dark:border-white pl-6 py-2">
                        Welcome to **Distrapness** (the "Site"). We maintain this Site as a service to our visitors, subject to the following terms and conditions concerning the use of the Site ("Terms of Use").
                    </p>

                    <h2 className="text-[12px] font-black uppercase tracking-[0.3em] mt-12 mb-4 text-black dark:text-white">1. Use of Content on the Site</h2>
                    <p className="opacity-80">
                        You may view, download, and print contents from the Site subject to the following conditions: (a) the content may be used solely for information purposes; and (b) the content may not be modified or altered in any way. 
                    </p>

                    <h2 className="text-[12px] font-black uppercase tracking-[0.3em] mt-12 mb-4 text-black dark:text-white">2. Shipping & Delivery</h2>
                    <p className="opacity-80">
                        We aim to process and ship orders within 1-2 business days. Delivery times may vary depending on your location. We are not responsible for delays caused by the shipping carrier.
                    </p>

                    <h2 className="text-[12px] font-black uppercase tracking-[0.3em] mt-12 mb-4 text-black dark:text-white">3. Returns & Refunds</h2>
                    <p className="opacity-80">
                        We accept returns within 7 days of purchase if the item is unused and in original packaging. Refunds will be processed to the original method of payment.
                    </p>

                    <h2 className="text-[12px] font-black uppercase tracking-[0.3em] mt-12 mb-4 text-black dark:text-white">4. User Account</h2>
                    <p className="opacity-80">
                        If you use this site, you are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer.
                    </p>

                    <h2 className="text-[12px] font-black uppercase tracking-[0.3em] mt-12 mb-4 text-black dark:text-white">5. Governing Law</h2>
                    <p className="opacity-80">
                        These Terms shall be governed and construed in accordance with the laws of Indonesia, without regard to its conflict of law provisions.
                    </p>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default TermsPage;
