import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Calendar from "@/pages/Calendar";
import Children from "@/pages/Children";
import Family from "@/pages/Family";
import Appointments from "@/pages/Appointments";
import AppointmentDetail from "@/pages/AppointmentDetail";
import CreateAppointment from "@/pages/CreateAppointment";
import AIAssistant from "@/pages/AIAssistant";
import Notifications from "@/pages/Notifications";
import Integrations from "@/pages/Integrations";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/children" element={<Children />} />
              <Route path="/family" element={<Family />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/appointments/new" element={<CreateAppointment />} />
              <Route path="/appointments/:id" element={<AppointmentDetail />} />
              <Route path="/appointments/:id/edit" element={<CreateAppointment />} />
              <Route path="/ai-assistant" element={<AIAssistant />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/integrations" element={<Integrations />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
