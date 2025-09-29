import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/react-app/pages/Home";
import Assessment from "@/react-app/pages/Assessment";
import Results from "@/react-app/pages/Results";
import BestCountries from "@/react-app/pages/BestCountries";
import SampleReport from "@/react-app/pages/SampleReport";
import AboutUs from "@/react-app/pages/AboutUs";
import PrivacyPolicy from "@/react-app/pages/PrivacyPolicy";
import TermsOfService from "@/react-app/pages/TermsOfService";
import RelocationHub from "@/react-app/pages/RelocationHub";
import CityDetails from "@/react-app/pages/CityDetails";
import SocialLogin from "@/react-app/pages/SocialLogin";
import SystemLogin from "@/react-app/pages/SystemLogin";
import AdminConfig from "@/react-app/pages/AdminConfig";
import TestReports from "@/react-app/pages/TestReports";
import EmailTest from "@/react-app/pages/EmailTest";
import PaymentDebug from "@/react-app/pages/PaymentDebug";
import StripeKeyDiagnostic from "@/react-app/pages/StripeKeyDiagnostic";
import WorkerDiagnostics from "@/react-app/pages/WorkerDiagnostics";
import JobProcessor from "@/react-app/pages/JobProcessor";
import RAGInterface from "@/react-app/pages/RAGInterface";
import RAGDashboard from "@/react-app/pages/RAGDashboard";

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        {/* Main Application Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/assessment" element={<Assessment />} />
        <Route path="/results/:assessmentId" element={<Results />} />
        <Route path="/best-countries" element={<BestCountries />} />
        <Route path="/sample-report" element={<SampleReport />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/relocation-hub/:id" element={<RelocationHub />} />
        <Route path="/city/:country/:city" element={<CityDetails />} />
        <Route path="/social-login" element={<SocialLogin />} />
        
        {/* Admin Routes */}
        <Route path="/system-login" element={<SystemLogin />} />
        <Route path="/admin/config" element={<AdminConfig />} />
        <Route path="/test-reports" element={<TestReports />} />
        <Route path="/email-test" element={<EmailTest />} />
        <Route path="/payment-debug" element={<PaymentDebug />} />
        <Route path="/stripe-diagnostic" element={<StripeKeyDiagnostic />} />
            <Route path="/worker-diagnostics" element={<WorkerDiagnostics />} />
        <Route path="/job-processor" element={<JobProcessor />} />
        
        {/* RAG Interface Routes */}
        <Route path="/rag" element={<RAGInterface />} />
        <Route path="/rag/dashboard" element={<RAGDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
