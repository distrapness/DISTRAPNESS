import React from "react";
import Footer from "../components/Footer";

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 pt-[100px] pb-12 transition-colors duration-500">
            <div className="max-w-4xl mx-auto px-6">
                <h1 className="text-3xl font-[900] uppercase tracking-wider mb-8 text-black dark:text-white text-center">Privacy Policy</h1>

                <div className="text-gray-700 dark:text-gray-300 space-y-6 leading-relaxed text-sm md:text-base">
                    <p>
                        Welcome to **Distrapness**. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
                    </p>

                    <h2 className="text-xl font-bold uppercase tracking-wide mt-8 mb-4 text-black dark:text-white">1. Information We Collect</h2>
                    <p>
                        We may collect information about you in a variety of ways. The information we may collect on the Site includes:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-2">
                        <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, shipping address, email address, and telephone number, that you voluntarily give to us when you register with the Site or when you choose to participate in various activities related to the Site.</li>
                        <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the Site, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Site.</li>
                    </ul>

                    <h2 className="text-xl font-bold uppercase tracking-wide mt-8 mb-4 text-black dark:text-white">2. Use of Your Information</h2>
                    <p>
                        Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-2">
                        <li>Create and manage your account.</li>
                        <li>Process your payments and refunds.</li>
                        <li>Send you an email regarding your order or account.</li>
                        <li>Fulfill and manage purchases, orders, payments, and other transactions related to the Site.</li>
                    </ul>

                    <h2 className="text-xl font-bold uppercase tracking-wide mt-8 mb-4 text-black dark:text-white">3. Contact Us</h2>
                    <p>
                        If you have questions or comments about this Privacy Policy, please contact us at:<br />
                        <strong>Email:</strong> support@distrapness.com<br />
                        <strong>Phone:</strong> +62 812-3456-7890
                    </p>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default PrivacyPolicy;
