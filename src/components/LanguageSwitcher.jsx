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
                    className={`px-3 py-1.5 text-xs font-bold tracking-wider rounded-lg transition-all border backdrop-blur-md ${i18n.language === lng.code
                        ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                        : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20 hover:text-white hover:border-white/40'
                        }`}
                >
                    {lng.label}
                </button>
            ))}
        </div>
    );
}
