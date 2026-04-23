import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, X, ChevronDown, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const navItems = [
  {
    label: "Company",
    children: [
      { label: "About", to: "/about" },
      { label: "Team", to: "/team" },
      { label: "Roadmap", to: "/roadmap" },
      { label: "Careers", to: "/careers" },
    ],
  },
  {
    label: "Products",
    children: [
      { label: "For Users", to: "/products/users" },
      { label: "For Developers", to: "/products/developers" },
      { label: "For Investors", to: "/products/investors" },
      { label: "For Partnerships", to: "/products/partnerships" },
    ],
  },
  {
    label: "Resources",
    children: [
      { label: "Blog", to: "/blog" },
      { label: "Documentation", to: "/docs" },
      { label: "API", to: "/api" },
      { label: "Support", to: "/support" },
      { label: "FAQ", to: "/faq" },
    ],
  },
  {
    label: "Legal",
    children: [
      { label: "Terms of Use", to: "/legal/terms" },
      { label: "Privacy Policy", to: "/legal/privacy" },
      { label: "Legal Center", to: "/legal/center" },
      { label: "Licenses", to: "/legal/licenses" },
      { label: "Legal Information", to: "/legal/info" },
    ],
  },
];

export default function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/70 dark:bg-dark-deeper/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5 transition-colors">
        <div className="container-max flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-light-bg/60 hover:text-accent-pink dark:hover:text-accent-pink bg-gray-100/80 dark:bg-white/5 hover:bg-gray-200/80 dark:hover:bg-white/10 transition-all"
              aria-label="Open menu"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-pink to-accent-cyan flex items-center justify-center">
                <span className="text-white font-poppins font-bold text-sm">S</span>
              </div>
              <span className="font-poppins font-bold text-lg text-gray-900 dark:text-light-bg group-hover:text-accent-pink transition-colors">
                SoundAI
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 dark:text-light-bg/60 hover:text-accent-pink dark:hover:text-accent-pink bg-gray-100/80 dark:bg-white/5 hover:bg-gray-200/80 dark:hover:bg-white/10 transition-all"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link to="/coming-soon" className="btn-secondary text-xs px-4 py-2 hidden sm:inline-flex">
              Sign Up
            </Link>
            <Link to="/coming-soon" className="btn-primary text-xs px-4 py-2">
              Log In
            </Link>
          </div>
        </div>
      </header>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar drawer — frosted glass */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-80 max-w-[85vw] bg-white/80 dark:bg-dark-deeper/80 backdrop-blur-2xl border-r border-gray-200/50 dark:border-white/10 shadow-2xl transition-transform duration-300 ease-in-out overflow-y-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-gray-200/50 dark:border-white/5">
          <Link to="/" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-accent-pink to-accent-cyan flex items-center justify-center">
              <span className="text-white font-poppins font-bold text-xs">S</span>
            </div>
            <span className="font-poppins font-bold text-base text-gray-900 dark:text-light-bg">SoundAI</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-light-bg/60 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="px-3 py-4 space-y-1">
          <Link
            to="/"
            className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === "/"
                ? "text-accent-pink bg-accent-pink/5"
                : "text-gray-700 dark:text-light-bg/70 hover:text-gray-900 dark:hover:text-light-bg hover:bg-gray-50 dark:hover:bg-white/5"
            }`}
            onClick={() => setSidebarOpen(false)}
          >
            Home
          </Link>

          {navItems.map((item) => (
            <div key={item.label}>
              <button
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-light-bg/70 hover:text-gray-900 dark:hover:text-light-bg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                onClick={() => setOpenSection(openSection === item.label ? null : item.label)}
              >
                {item.label}
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    openSection === item.label ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  openSection === item.label ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="pl-3 py-1 space-y-0.5">
                  {item.children.map((child) => (
                    <Link
                      key={child.to}
                      to={child.to}
                      className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                        location.pathname === child.to
                          ? "text-accent-pink bg-accent-pink/5 font-medium"
                          : "text-gray-500 dark:text-light-bg/50 hover:text-accent-pink hover:bg-gray-50 dark:hover:bg-white/5"
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-gray-200/50 dark:border-white/5">
          <Link to="/coming-soon" className="btn-primary w-full text-xs mb-2" onClick={() => setSidebarOpen(false)}>
            Sign Up
          </Link>
          <Link to="/coming-soon" className="btn-secondary w-full text-xs" onClick={() => setSidebarOpen(false)}>
            Log In
          </Link>
        </div>
      </aside>
    </>
  );
}
