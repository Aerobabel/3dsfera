import React from 'react';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const languages = [
        { code: 'en', label: 'EN' },
        { code: 'ru', label: 'RU' },
        { code: 'zh', label: 'ZH' },
    ];

    return (
        <div className="flex gap-2">
            {languages.map((lng) => (
                <button
                    key={lng.code}
                    onClick={() => changeLanguage(lng.code)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors border ${i18n.language === lng.code
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                >
                    {lng.label}
                </button>
            ))}
        </div>
    );
}
