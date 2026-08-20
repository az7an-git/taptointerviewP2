import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        expand={false}
        theme="dark"
        richColors
        toastOptions={{
          style: {
            maxWidth: "calc(100vw - 32px)",
          },
        }}
      />
      <AppRoutes />
    </AuthProvider>
  );
}
