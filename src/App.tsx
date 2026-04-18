import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import AppLayout from "./app/AppLayout";
import AudioGenerator from "./app/pages/AudioGenerator";
import Prompts from "./app/pages/Prompts";
import Arrangement from "./app/pages/Arrangement";
import EditorMode from "./app/pages/EditorMode";
import Library from "./app/pages/Library";
import Integrations from "./app/pages/Integrations";
import Billing from "./app/pages/Billing";
import Profile from "./app/pages/Profile";
import Settings from "./app/pages/Settings";
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
        </Route>
        {/* Dashboard app */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="/app/generator" replace />} />
          <Route path="generator" element={<AudioGenerator />} />
          <Route path="prompts" element={<Prompts />} />
          <Route path="arrangement" element={<Arrangement />} />
          <Route path="editor" element={<EditorMode />} />
          <Route path="library" element={<Library />} />
          <Route path="integrations" element={<Integrations />} />
          <Route path="billing" element={<Billing />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
