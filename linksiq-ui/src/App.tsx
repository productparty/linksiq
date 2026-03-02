import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { Analytics } from "@vercel/analytics/react";
import theme from "./theme";
import { AuthProvider } from "./context/AuthContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";

import { Landing } from "./pages/Landing";
import { CourseList } from "./pages/CourseList";
import { CourseDetail } from "./pages/CourseDetail";
import { HolePage } from "./pages/HolePage";
import { Walkthrough } from "./pages/Walkthrough";
import { Favorites } from "./pages/Favorites";
import { NotFound } from "./pages/NotFound";
import { SignIn } from "./pages/auth/SignIn";
import { CreateAccount } from "./pages/auth/CreateAccount";
import { PasswordReset } from "./pages/auth/PasswordReset";
import { AuthCallback } from "./pages/auth/AuthCallback";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <FavoritesProvider>
              <BrowserRouter>
                <Routes>
                  <Route element={<Layout />}>
                    <Route path="/" element={<Landing />} />
                    <Route path="/courses" element={<CourseList />} />
                    <Route path="/courses/:id" element={<CourseDetail />} />
                    <Route path="/courses/:id/holes/:number" element={<HolePage />} />
                    <Route path="/courses/:id/walkthrough" element={<Walkthrough />} />
                    <Route
                      path="/favorites"
                      element={
                        <ProtectedRoute>
                          <Favorites />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/create-account" element={<CreateAccount />} />
                    <Route path="/reset-password" element={<PasswordReset />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </FavoritesProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
      <Analytics />
    </ErrorBoundary>
  );
}
