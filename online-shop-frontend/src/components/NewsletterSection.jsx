import React from 'react';

const NewsletterSection = () => {
    return (
        <section className="bg-gray-50 dark:bg-gray-950 py-24 border-t border-gray-100 dark:border-gray-900">
            <div className="max-w-2xl mx-auto px-4 text-center">
                <h3 className="text-xl font-bold uppercase tracking-widest mb-4 text-gray-900 dark:text-white">Subscribe & Save</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
                    Join our community for exclusive drops and 10% off your first order.
                </p>

                <form className="flex flex-col gap-4">
                    <input
                        type="email"
                        placeholder="Enter your email address"
                        className="w-full px-6 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-center text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors placeholder:text-gray-300"
                        required
                    />
                    <button
                        type="submit"
                        className="w-full bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest py-4 text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                    >
                        Subscribe
                    </button>
                </form>
            </div>
        </section>
    );
};

export default NewsletterSection;
