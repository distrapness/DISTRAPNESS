import React from "react";
import Footer from "../components/Footer";
import { useCurrency } from "../components/CurrencyContext.jsx";

const PrivacyPolicy = () => {
    const { t } = useCurrency();

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 pt-4 md:pt-6 pb-12 transition-colors duration-500">
            <div className="max-w-4xl mx-auto px-6">
                <h1 className="text-3xl font-[900] uppercase tracking-wider mb-8 text-black dark:text-white text-center">
                    {t('privacy.title')}
                </h1>

                <div className="text-gray-700 dark:text-gray-300 space-y-6 leading-relaxed text-sm md:text-base">
                    <p dangerouslySetInnerHTML={{ __html: t('privacy.intro').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />

                    <h2 className="text-xl font-bold uppercase tracking-wide mt-8 mb-4 text-black dark:text-white">
                        {t('privacy.sec1Title')}
                    </h2>
                    <p>
                        {t('privacy.sec1Desc')}
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-2">
                        <li dangerouslySetInnerHTML={{ __html: t('privacy.sec1Item1') }} />
                        <li dangerouslySetInnerHTML={{ __html: t('privacy.sec1Item2') }} />
                    </ul>

                    <h2 className="text-xl font-bold uppercase tracking-wide mt-8 mb-4 text-black dark:text-white">
                        {t('privacy.sec2Title')}
                    </h2>
                    <p>
                        {t('privacy.sec2Desc')}
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-2">
                        <li>{t('privacy.sec2Item1')}</li>
                        <li>{t('privacy.sec2Item2')}</li>
                        <li>{t('privacy.sec2Item3')}</li>
                        <li>{t('privacy.sec2Item4')}</li>
                    </ul>

                    <h2 className="text-xl font-bold uppercase tracking-wide mt-8 mb-4 text-black dark:text-white">
                        {t('privacy.sec3Title')}
                    </h2>
                    <p>
                        {t('privacy.sec3Desc')}<br />
                        <strong>{t('privacy.email')}:</strong> support@distrapness.com<br />
                        <strong>{t('privacy.phone')}:</strong> +62 812-3456-7890
                    </p>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default PrivacyPolicy;
