import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import CoursesPage from "@/pages/courses";
import ClassesPage from "@/pages/classes";
import StudentsPage from "@/pages/students";
import InstructorsPage from "@/pages/instructors";
import CertificatesPage from "@/pages/certificates";
import QcPage from "@/pages/qc";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/khoa-hoc" component={CoursesPage} />
      <Route path="/lop-hoc" component={ClassesPage} />
      <Route path="/hoc-vien" component={StudentsPage} />
      <Route path="/giang-vien" component={InstructorsPage} />
      <Route path="/chung-chi" component={CertificatesPage} />
      <Route path="/qc" component={QcPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
