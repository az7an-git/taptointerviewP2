import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" expand={false} theme="dark" richColors />
      <AppRoutes />
    </AuthProvider>
  );
}
