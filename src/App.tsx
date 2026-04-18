import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import About from "./pages/company/About";
import Team from "./pages/company/Team";
import Roadmap from "./pages/company/Roadmap";
import Careers from "./pages/company/Careers";
import ForUsers from "./pages/products/ForUsers";
import ForDevelopers from "./pages/products/ForDevelopers";
import ForInvestors from "./pages/products/ForInvestors";
import ForPartnerships from "./pages/products/ForPartnerships";
import Blog from "./pages/resources/Blog";
import Documentation from "./pages/resources/Documentation";
import Api from "./pages/resources/Api";
import Support from "./pages/resources/Support";
import Faq from "./pages/resources/Faq";
import Terms from "./pages/legal/Terms";
import Privacy from "./pages/legal/Privacy";
import LegalCenter from "./pages/legal/LegalCenter";
import Licenses from "./pages/legal/Licenses";
import LegalInfo from "./pages/legal/LegalInfo";
import ComingSoon from "./pages/ComingSoon";
import Auth from "./pages/Auth";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          {/* Company */}
          <Route path="/about" element={<About />} />
          <Route path="/team" element={<Team />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/careers" element={<Careers />} />
          {/* Products */}
          <Route path="/products/users" element={<ForUsers />} />
          <Route path="/products/developers" element={<ForDevelopers />} />
          <Route path="/products/investors" element={<ForInvestors />} />
          <Route path="/products/partnerships" element={<ForPartnerships />} />
          {/* Resources */}
          <Route path="/blog" element={<Blog />} />
          <Route path="/docs" element={<Documentation />} />
          <Route path="/api" element={<Api />} />
          <Route path="/support" element={<Support />} />
          <Route path="/faq" element={<Faq />} />
          {/* Legal */}
          <Route path="/legal/terms" element={<Terms />} />
          <Route path="/legal/privacy" element={<Privacy />} />
          <Route path="/legal/center" element={<LegalCenter />} />
          <Route path="/legal/licenses" element={<Licenses />} />
          <Route path="/legal/info" element={<LegalInfo />} />
          {/* Auth & Coming Soon */}
          <Route path="/coming-soon" element={<ComingSoon />} />
          <Route path="/auth" element={<Auth />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
