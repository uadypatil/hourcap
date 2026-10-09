import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "./components/common/ToastProvider";
import { ThemeController } from "./components/common/ThemeController";
import { AuthProvider } from "./hooks/useAuth";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <ToastProvider>
      <ThemeController>
        <AuthProvider>
          <BrowserRouter><AppRoutes /></BrowserRouter>
        </AuthProvider>
      </ThemeController>
    </ToastProvider>
  );
}
