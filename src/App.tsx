import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Suspense, lazy } from "react";

const Layout = lazy(() => import("./components/Layout"));
const AppLayout = lazy(() => import("./app/AppLayout"));
const AudioGenerator = lazy(() => import("./app/pages/AudioGenerator"));
const Prompts = lazy(() => import("./app/pages/Prompts"));
const Arrangement = lazy(() => import("./app/pages/Arrangement"));
const EditorMode = lazy(() => import("./app/pages/EditorMode"));
const Library = lazy(() => import("./app/pages/Library"));
const Export = lazy(() => import("./app/pages/Export"));
const Integrations = lazy(() => import("./app/pages/Integrations"));
const Billing = lazy(() => import("./app/pages/Billing"));
const Profile = lazy(() => import("./app/pages/Profile"));
const Settings = lazy(() => import("./app/pages/Settings"));
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/company/About"));
const Team = lazy(() => import("./pages/company/Team"));
const Roadmap = lazy(() => import("./pages/company/Roadmap"));
const Careers = lazy(() => import("./pages/company/Careers"));
const ForUsers = lazy(() => import("./pages/products/ForUsers"));
const ForDevelopers = lazy(() => import("./pages/products/ForDevelopers"));
const ForInvestors = lazy(() => import("./pages/products/ForInvestors"));
const ForPartnerships = lazy(() => import("./pages/products/ForPartnerships"));
const Blog = lazy(() => import("./pages/resources/Blog"));
const Documentation = lazy(() => import("./pages/resources/Documentation"));
const Api = lazy(() => import("./pages/resources/Api"));
const Support = lazy(() => import("./pages/resources/Support"));
const Faq = lazy(() => import("./pages/resources/Faq"));
const Terms = lazy(() => import("./pages/legal/Terms"));
const Privacy = lazy(() => import("./pages/legal/Privacy"));
const LegalCenter = lazy(() => import("./pages/legal/LegalCenter"));
const Licenses = lazy(() => import("./pages/legal/Licenses"));
const LegalInfo = lazy(() => import("./pages/legal/LegalInfo"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));
const Auth = lazy(() => import("./pages/Auth"));

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eff3f6] px-6">
      <div className="rounded-card border border-primary/20 bg-white px-6 py-4 font-poppins text-sm font-medium text-text shadow-flat-sm">
        Loading SoundAI...
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />

            <Route path="/about" element={<About />} />
            <Route path="/team" element={<Team />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/careers" element={<Careers />} />

            <Route path="/products/users" element={<ForUsers />} />
            <Route path="/products/developers" element={<ForDevelopers />} />
            <Route path="/products/investors" element={<ForInvestors />} />
            <Route path="/products/partnerships" element={<ForPartnerships />} />

            <Route path="/blog" element={<Blog />} />
            <Route path="/docs" element={<Documentation />} />
            <Route path="/api" element={<Api />} />
            <Route path="/support" element={<Support />} />
            <Route path="/faq" element={<Faq />} />

            <Route path="/legal/terms" element={<Terms />} />
            <Route path="/legal/privacy" element={<Privacy />} />
            <Route path="/legal/center" element={<LegalCenter />} />
            <Route path="/legal/licenses" element={<Licenses />} />
            <Route path="/legal/info" element={<LegalInfo />} />

            <Route path="/coming-soon" element={<ComingSoon />} />
            <Route path="/auth" element={<Auth />} />
          </Route>

          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Navigate to="/app/generator" replace />} />
            <Route path="generator" element={<AudioGenerator />} />
            <Route path="prompts" element={<Prompts />} />
            <Route path="arrangement" element={<Arrangement />} />
            <Route path="editor" element={<EditorMode />} />
            <Route path="library" element={<Library />} />
            <Route path="export" element={<Export />} />
            <Route path="integrations" element={<Integrations />} />
            <Route path="billing" element={<Billing />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
