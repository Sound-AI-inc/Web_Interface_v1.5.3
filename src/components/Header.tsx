import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-dark-deeper/80 backdrop-blur-xl border-b border-white/5">
      <div className="container-max flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-pink to-accent-cyan flex items-center justify-center">
            <span className="text-white font-poppins font-bold text-sm">S</span>
          </div>
          <span className="font-poppins font-bold text-lg text-light-bg group-hover:text-accent-pink transition-colors">
            SoundAI
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <div
              key={item.label}
              className="relative"
              onMouseEnter={() => setOpenDropdown(item.label)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button className="flex items-center gap-1 px-3 py-2 text-sm text-light-bg/70 hover:text-light-bg transition-colors font-medium">
                {item.label}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {openDropdown === item.label && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-dark-bg border border-white/10 rounded-xl shadow-2xl shadow-black/40 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  {item.children.map((child) => (
                    <Link
                      key={child.to}
                      to={child.to}
                      className={`block px-4 py-2.5 text-sm transition-colors ${
                        location.pathname === child.to
                          ? "text-accent-pink bg-accent-pink/5"
                          : "text-light-bg/70 hover:text-light-bg hover:bg-white/5"
                      }`}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Link to="/products/users" className="btn-secondary text-xs px-4 py-2">
            Start Creating
          </Link>
          <Link to="/about" className="btn-primary text-xs px-4 py-2">
            Join Beta
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden text-light-bg/70 hover:text-light-bg"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="lg:hidden bg-dark-deeper border-t border-white/5 max-h-screen overflow-y-auto">
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <div key={item.label}>
                <button
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-light-bg/70"
                  onClick={() =>
                    setOpenDropdown(openDropdown === item.label ? null : item.label)
                  }
                >
                  {item.label}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      openDropdown === item.label ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openDropdown === item.label && (
                  <div className="pl-4 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.to}
                        to={child.to}
                        className="block px-3 py-2 text-sm text-light-bg/60 hover:text-accent-pink"
                        onClick={() => setMobileOpen(false)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-4 flex flex-col gap-2">
              <Link to="/products/users" className="btn-secondary text-xs" onClick={() => setMobileOpen(false)}>
                Start Creating
              </Link>
              <Link to="/about" className="btn-primary text-xs" onClick={() => setMobileOpen(false)}>
                Join Beta
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
