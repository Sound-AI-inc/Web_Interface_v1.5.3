import { Link } from "react-router-dom";
import { Mail, Twitter, Github, Linkedin, Youtube } from "lucide-react";

const footerNav = [
  {
    title: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Team", to: "/team" },
      { label: "Roadmap", to: "/roadmap" },
      { label: "Careers", to: "/careers" },
    ],
  },
  {
    title: "Products",
    links: [
      { label: "For Users", to: "/products/users" },
      { label: "For Developers", to: "/products/developers" },
      { label: "For Investors", to: "/products/investors" },
      { label: "Partnerships", to: "/products/partnerships" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", to: "/blog" },
      { label: "Documentation", to: "/docs" },
      { label: "API", to: "/api" },
      { label: "Support", to: "/support" },
      { label: "FAQ", to: "/faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Use", to: "/legal/terms" },
      { label: "Privacy Policy", to: "/legal/privacy" },
      { label: "Legal Center", to: "/legal/center" },
      { label: "Licenses", to: "/legal/licenses" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-dark-deeper border-t border-gray-200 dark:border-white/5 transition-colors">
      <div className="container-max section-padding">
        {/* Newsletter */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-12 border-b border-gray-200 dark:border-white/5">
          <div>
            <h3 className="font-poppins font-bold text-xl mb-1 text-gray-900 dark:text-light-bg">Stay in the loop</h3>
            <p className="text-gray-500 dark:text-light-bg/50 text-sm">Get updates on new features, tutorials, and product launches.</p>
          </div>
          <div className="flex w-full md:w-auto">
            <input
              type="email"
              placeholder="you@example.com"
              className="flex-1 md:w-64 bg-white dark:bg-dark-bg border border-gray-300 dark:border-white/10 rounded-l-lg px-4 py-2.5 text-sm text-gray-900 dark:text-light-bg placeholder:text-gray-400 dark:placeholder:text-light-bg/30 focus:outline-none focus:border-accent-pink/50"
            />
            <button className="btn-primary rounded-l-none rounded-r-lg text-xs px-5">
              Subscribe
            </button>
          </div>
        </div>

        {/* Nav grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12">
          {footerNav.map((section) => (
            <div key={section.title}>
              <h4 className="font-poppins font-semibold text-sm text-gray-900 dark:text-light-bg mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-gray-500 dark:text-light-bg/50 hover:text-accent-pink transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-gray-200 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-accent-pink to-accent-cyan flex items-center justify-center">
              <span className="text-white font-poppins font-bold text-xs">S</span>
            </div>
            <span className="font-poppins font-semibold text-sm text-gray-900 dark:text-light-bg">SoundAI</span>
            <span className="text-gray-300 dark:text-light-bg/30 text-xs">|</span>
            <span className="text-gray-400 dark:text-light-bg/40 text-xs italic">Future-Forward Innovation</span>
          </div>

          <div className="flex items-center gap-4">
            <a href="mailto:hello@soundai.studio" className="text-gray-400 dark:text-light-bg/40 hover:text-accent-cyan transition-colors">
              <Mail className="w-4 h-4" />
            </a>
            <a href="#" className="text-gray-400 dark:text-light-bg/40 hover:text-accent-cyan transition-colors">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="#" className="text-gray-400 dark:text-light-bg/40 hover:text-accent-cyan transition-colors">
              <Github className="w-4 h-4" />
            </a>
            <a href="#" className="text-gray-400 dark:text-light-bg/40 hover:text-accent-cyan transition-colors">
              <Linkedin className="w-4 h-4" />
            </a>
            <a href="#" className="text-gray-400 dark:text-light-bg/40 hover:text-accent-cyan transition-colors">
              <Youtube className="w-4 h-4" />
            </a>
          </div>

          <p className="text-gray-400 dark:text-light-bg/30 text-xs">
            &copy; {new Date().getFullYear()} SoundAI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
