import { Home, Mail, Database, Settings } from "lucide-react";

export const navItems = [
  {
    title: "Home",
    titleKey: "nav.home",
    to: "/",
    icon: <Home className="h-4 w-4" />,
  },
  {
    title: "Newsletter",
    titleKey: "nav.newsletter",
    to: "/newsletter",
    icon: <Mail className="h-4 w-4" />,
  },
  {
    title: "KI-Datenbank",
    titleKey: "nav.database",
    to: "/interactive-database",
    icon: <Database className="h-4 w-4" />,
  },
  {
    title: "RSS Verwaltung",
    titleKey: "nav.rss",
    to: "/rss-manager",
    icon: <Settings className="h-4 w-4" />,
  },
];
