import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth.jsx";
import { Layout } from "./components/Layout.jsx";
import { Spinner } from "./components/ui.jsx";
import { Landing } from "./pages/Landing.jsx";
import { Login } from "./pages/Login.jsx";
import { Register } from "./pages/Register.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Instruments } from "./pages/Instruments.jsx";
import { InstrumentDetail } from "./pages/InstrumentDetail.jsx";
import { Applications } from "./pages/Applications.jsx";
import { NewApplication } from "./pages/NewApplication.jsx";
import { ApplicationDetail } from "./pages/ApplicationDetail.jsx";
import { VerifyEntry } from "./pages/VerifyEntry.jsx";
import { Verifications } from "./pages/Verifications.jsx";
import { VerificationDetail } from "./pages/VerificationDetail.jsx";
import { Certificates } from "./pages/Certificates.jsx";
import { CertificateView } from "./pages/CertificateView.jsx";
import { PublicVerify } from "./pages/PublicVerify.jsx";
import { Alerts } from "./pages/Alerts.jsx";
import { SearchPage } from "./pages/SearchPage.jsx";
import { AdminUsers } from "./pages/AdminUsers.jsx";

function Protected() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><Spinner /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-certificate" element={<PublicVerify />} />

          <Route element={<Protected />}>
            <Route path="/app" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="instruments" element={<Instruments />} />
              <Route path="instruments/:id" element={<InstrumentDetail />} />
              <Route path="applications" element={<Applications />} />
              <Route path="applications/new" element={<NewApplication />} />
              <Route path="applications/:id" element={<ApplicationDetail />} />
              <Route path="verify" element={<VerifyEntry />} />
              <Route path="verifications" element={<Verifications />} />
              <Route path="verifications/:id" element={<VerificationDetail />} />
              <Route path="certificates" element={<Certificates />} />
              <Route path="certificates/:id" element={<CertificateView />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="users" element={<AdminUsers />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}