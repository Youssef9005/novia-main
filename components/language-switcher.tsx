"use client";

import { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages.find(lang => lang.code === language);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative h-9 px-3 bg-gray-900/50 border-gray-700 hover:bg-gray-800/70 hover:border-gray-600 transition-all duration-200"
        >
          <Globe className="h-4 w-4 mr-2 text-gray-300" />
          <span className="text-sm font-medium text-gray-200">
            {currentLanguage?.flag} {currentLanguage?.name}
          </span>
          <ChevronDown className={`h-3 w-3 ml-2 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 bg-gray-900/95 backdrop-blur-md border-gray-700 shadow-xl"
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => {
              setLanguage(lang.code as 'en' | 'ar');
              setIsOpen(false);
            }}
            className={`
              flex items-center px-3 py-2 cursor-pointer transition-colors duration-200
              ${language === lang.code 
                ? 'bg-blue-600/20 text-blue-300 border-l-2 border-blue-500' 
                : 'text-gray-300 hover:bg-gray-800/70 hover:text-white'
              }
            `}
          >
            <span className="text-lg mr-3">{lang.flag}</span>
            <span className="font-medium">{lang.name}</span>
            {language === lang.code && (
              <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
