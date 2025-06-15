import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, Mail, Archive, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import NewsletterArchiveQA from "@/components/NewsletterArchiveQA";

const ArchiveQA = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Navigation Header */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                  <Archive className="h-5 w-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">KI News Digest</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                to="/" 
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <Home className="h-4 w-4" />
                Home
              </Link>
              <Link 
                to="/newsletter" 
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <Mail className="h-4 w-4" />
                Newsletter
              </Link>
              <Link 
                to="/archive-qa" 
                className="flex items-center gap-2 text-primary font-medium px-3 py-2 rounded-md text-sm bg-primary/10 transition-colors"
              >
                <Archive className="h-4 w-4" />
                Archiv Q&A
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link 
                to="/" 
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home className="h-4 w-4" />
                Home
              </Link>
              <Link 
                to="/newsletter" 
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Mail className="h-4 w-4" />
                Newsletter
              </Link>
              <Link 
                to="/archive-qa" 
                className="flex items-center gap-2 text-primary font-medium block px-3 py-2 rounded-md text-base bg-primary/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Archive className="h-4 w-4" />
                Archiv Q&A
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="py-8">
        <NewsletterArchiveQA />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-600">
            <p className="text-sm">
              KI News Digest - Newsletter-Archiv Q&A System für Studierende
            </p>
            <p className="text-xs mt-1">
              Durchsuchen Sie alle vergangenen Newsletter und stellen Sie Fragen zu KI-Trends und Entwicklungen
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ArchiveQA; 