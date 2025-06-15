import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { navItems } from "@/nav-items";
import { useTranslation } from "@/contexts/TranslationContext";
import LanguageSwitcher from "./LanguageSwitcher";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="border-b border-white/20 bg-white/40 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-black/5">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
              📰 {t('header.title')}
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to}>
                <Button 
                  variant={location.pathname === item.to ? "default" : "ghost"}
                  className={`flex items-center gap-2 transition-all duration-200 ${
                    location.pathname === item.to 
                      ? "bg-blue-600 text-white shadow-md" 
                      : "hover:bg-white/60 hover:backdrop-blur-md hover:shadow-sm hover:border hover:border-white/30"
                  }`}
                >
                  {item.icon}
                  {t(item.titleKey)}
                </Button>
              </Link>
            ))}
            <LanguageSwitcher />
          </nav>

          <Button
            variant="ghost"
            className="md:hidden hover:bg-white/60"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {isMobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-white/20 pt-4">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setIsMobileMenuOpen(false)}>
                  <Button 
                    variant={location.pathname === item.to ? "default" : "ghost"}
                    className={`w-full justify-start flex items-center gap-2 transition-all duration-200 ${
                      location.pathname === item.to 
                        ? "bg-blue-600 text-white shadow-md" 
                        : "hover:bg-white/60 hover:backdrop-blur-md hover:shadow-sm"
                    }`}
                  >
                    {item.icon}
                    {t(item.titleKey)}
                  </Button>
                </Link>
              ))}
              <div className="pt-2">
                <LanguageSwitcher />
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header; 