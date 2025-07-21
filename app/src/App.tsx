import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import DeviceOverview from "./pages/DeviceOverview";
import CPUDetails from "./pages/CPUDetails";
import ProcessList from "./pages/ProcessList";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/device/:deviceId/overview" element={<DeviceOverview />} />
          <Route path="/device/:deviceId/control" element={<DeviceOverview />} />
          <Route path="/device/:deviceId/cpu" element={<CPUDetails />} />
          <Route path="/device/:deviceId/memory" element={<DeviceOverview />} />
          <Route path="/device/:deviceId/disk" element={<DeviceOverview />} />
          <Route path="/device/:deviceId/network" element={<DeviceOverview />} />
          <Route path="/device/:deviceId/battery" element={<DeviceOverview />} />
          <Route path="/device/:deviceId/temperature" element={<DeviceOverview />} />
          <Route path="/device/:deviceId/processes" element={<ProcessList />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
