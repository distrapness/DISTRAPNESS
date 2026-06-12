import React from "react";
import Footer from "../components/Footer";
import { useCurrency } from "../components/CurrencyContext.jsx";

const TermsPage = () => {
    const { t } = useCurrency();

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 pt-4 md:pt-6 pb-12 transition-colors duration-500">
            <div className="max-w-4xl mx-auto px-6">
                <h1 className="text-3xl font-[900] uppercase tracking-wider mb-8 text-black dark:text-white text-center">
                    {t('terms.title')}
                </h1>

                <div className="text-gray-500 dark:text-gray-400 space-y-8 leading-loose text-sm tracking-wide">
                    <p 
                        className="italic font-medium text-gray-900 dark:text-white border-l-4 border-black dark:border-white pl-6 py-2"
                        dangerouslySetInnerHTML={{ __html: t('terms.intro').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                    />

                    <h2 className="text-[12px] font-black uppercase tracking-[0.3em] mt-12 mb-4 text-black dark:text-white">
                        {t('terms.sec1Title')}
                    </h2>
                    <p className="opacity-80">
                        {t('terms.sec1Desc')}
                    </p>

                    <h2 className="text-[12px] font-black uppercase tracking-[0.3em] mt-12 mb-4 text-black dark:text-white">
                        {t('terms.sec2Title')}
                    </h2>
                    <p className="opacity-80">
                        {t('terms.sec2Desc')}
                    </p>

                    <h2 className="text-[12px] font-black uppercase tracking-[0.3em] mt-12 mb-4 text-black dark:text-white">
                        {t('terms.sec3Title')}
                    </h2>
                    <p className="opacity-80">
                        {t('terms.sec3Desc')}
                    </p>

                    <h2 className="text-[12px] font-black uppercase tracking-[0.3em] mt-12 mb-4 text-black dark:text-white">
                        {t('terms.sec4Title')}
                    </h2>
                    <p className="opacity-80">
                        {t('terms.sec4Desc')}
                    </p>

                    <h2 className="text-[12px] font-black uppercase tracking-[0.3em] mt-12 mb-4 text-black dark:text-white">
                        {t('terms.sec5Title')}
                    </h2>
                    <p className="opacity-80">
                        {t('terms.sec5Desc')}
                    </p>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default TermsPage;
