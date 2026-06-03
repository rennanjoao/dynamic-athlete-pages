/**
 * App.tsx — Roteamento.
 *
 * Rotas:
 * /                → Landing (Index)
 * /auth            → Login / cadastro aluno
 * /student         → Página pública do aluno (id=?)
 * /student-area    → Área do Aluno (hub: anamnese, check-in, evolução, treino, dieta)
 * /anamnesis       → Anamnese
 * /check-in        → Feedback / check-in periódico
 * /evolution       → Painel de Evolução
 * /routine         → Estratégia nutricional
 * /workout-plan    → Treino do dia
 * /coach           → Dashboard do coach (alert-first)
 * /admin-login     → Login admin
 * /admin           → Painel admin
 */

import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminGuard } from "./components/admin/AdminGuard";
import { AnamnesisGuard } from "./components/student/AnamnesisGuard";
import { NavigationControls } from "@/components/NavigationControls";

// Lazy-loaded pages (split bundle por rota)
const Index        = lazy(() => import("./pages/Index"));
const Student      = lazy(() => import("./pages/Student"));
const Admin        = lazy(() => import("./pages/Admin"));
const AdminLogin   = lazy(() => import("./pages/AdminLogin"));
const Auth         = lazy(() => import("./pages/Auth"));
const StudentArea  = lazy(() => import("./pages/StudentArea"));
const NotFound     = lazy(() => import("./pages/NotFound"));

// Novas páginas refatoradas
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const CoachDashboard   = lazy(() => import("./pages/CoachDashboard"));
const Anamnesis        = lazy(() => import("./pages/Anamnesis"));
const CheckIn          = lazy(() => import("./pages/CheckIn"));
const Evolution        = lazy(() => import("./pages/Evolution"));
const DynamicRoutine   = lazy(() => import("./pages/DynamicRoutine"));
const WorkoutPlanPage  = lazy(() => import("./pages/WorkoutPlan"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,          // 1 min
      gcTime: 5 * 60_000,         // 5 min
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
      <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        {/* App principal */}
        <BrowserRouter>
          <NavigationControls />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Públicas */}
              <Route path="/"            element={<Index />} />
              <Route path="/student"     element={<Student />} />
              <Route path="/auth"        element={<Auth />} />
              <Route path="/admin-login" element={<AdminLogin />} />

              {/* Aluno autenticado - Protegido pela trava AnamnesisGuard */}
              <Route path="/student-area" element={<AnamnesisGuard><StudentArea /></AnamnesisGuard>} />
              <Route path="/fitness"      element={<Navigate to="/student-area" replace />} />
              <Route path="/anamnesis"    element={<AnamnesisGuard><Anamnesis /></AnamnesisGuard>} />
              <Route path="/check-in"     element={<AnamnesisGuard><CheckIn /></AnamnesisGuard>} />
              <Route path="/evolution"    element={<AnamnesisGuard><Evolution /></AnamnesisGuard>} />
              <Route path="/routine"      element={<AnamnesisGuard><DynamicRoutine /></AnamnesisGuard>} />
              <Route path="/workout-plan" element={<AnamnesisGuard><WorkoutPlanPage /></AnamnesisGuard>} />
              <Route path="/daily"        element={<AnamnesisGuard><StudentDashboard /></AnamnesisGuard>} />

              {/* Coach */}
              <Route
                path="/coach"
                element={
                  <AdminGuard requiredRole="coach">
                    <CoachDashboard />
                  </AdminGuard>
                }
              />

              {/* Admin */}
              <Route
                path="/admin"
                element={
                  <AdminGuard>
                    <Admin />
                  </AdminGuard>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
