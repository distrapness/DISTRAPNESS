import React from "react";
import { useCurrency } from "../components/CurrencyContext.jsx";
import Footer from "../components/Footer";

const HowToOrder = () => {
  const { t } = useCurrency();

  const steps = [
    { key: 'step1' }, { key: 'step2' }, { key: 'step3' },
    { key: 'step4' }, { key: 'step5' }, { key: 'step6' },
    { key: 'step7' }, { key: 'step8' }, { key: 'step9' }
  ];

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <div className="max-w-3xl mx-auto py-16 px-6 bg-white dark:bg-gray-800/50 rounded-2xl shadow-sm md:shadow-xl mt-10 mb-20 border border-gray-100 dark:border-gray-700">
        <h1 className="text-3xl font-[900] uppercase tracking-tighter mb-10 text-center text-black dark:text-white">
          {t('howToOrder.title')}
        </h1>
        <div className="space-y-8">
          {steps.map((step, idx) => (
            <div key={step.key} className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black">
                {idx + 1}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold uppercase tracking-tight mb-1 dark:text-white">
                  {t(`howToOrder.${step.key}.title`)}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t(`howToOrder.${step.key}.desc`)}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-gray-50 dark:border-gray-700 text-center text-xs text-gray-400 uppercase tracking-widest leading-loose italic px-4">
          {t('howToOrder.footer')}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HowToOrder;
