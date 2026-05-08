import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import LeadsBox from "./pages/LeadsBox";
import FacebookLeads from "./pages/FacebookLeads";
import Inbox from "./pages/Inbox";
import EmailInbox from "./pages/EmailInbox";
import WhatsAppInbox from "./pages/WhatsAppInbox";
import FacebookInbox from "./pages/FacebookInbox";
import Contacts from "./pages/Contacts";
import Schedule from "./pages/Schedule";
import ScheduleLeads from "./pages/ScheduleLeads";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/leads" element={<LeadsBox />} />
              <Route path="/leads/facebook" element={<FacebookLeads />} />
              <Route path="/inbox" element={<Inbox />} />
              <Route path="/inbox/whatsapp" element={<WhatsAppInbox />} />
              <Route path="/inbox/email" element={<EmailInbox />} />
              <Route path="/inbox/facebook" element={<FacebookInbox />} />
              <Route path="/inbox/:channel" element={<Inbox />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/schedule-leads" element={<ScheduleLeads />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
