import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/auth";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import CoursesPage from "@/pages/courses";
import ClassesPage from "@/pages/classes";
import StudentsPage from "@/pages/students";
import InstructorsPage from "@/pages/instructors";
import CertificatesPage from "@/pages/certificates";
import QcPage from "@/pages/qc";
import LoginPage from "@/pages/login";
import AccountsPage from "@/pages/accounts";

const queryClient = new QueryClient();

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="*" component={LoginPage} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/khoa-hoc" component={CoursesPage} />
      <Route path="/lop-hoc" component={ClassesPage} />
      <Route path="/hoc-vien" component={StudentsPage} />
      <Route path="/giang-vien" component={InstructorsPage} />
      <Route path="/chung-chi" component={CertificatesPage} />
      <Route path="/qc">
        {user.role === "qc" ? <QcPage /> : <Redirect to="/" />}
      </Route>
      <Route path="/tai-khoan">
        {user.role === "qc" ? <AccountsPage /> : <Redirect to="/" />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
