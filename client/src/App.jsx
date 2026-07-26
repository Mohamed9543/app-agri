import { Navigate, Route, Routes } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Stations from "./pages/Stations";
import StationDetail from "./pages/StationDetail";
import ParcelleWork from "./pages/ParcelleWork";
import ParcelleTable from "./pages/ParcelleTable";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function FullPageLoader() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center text-slate-400">
      {t("app.loading")}
    </div>
  );
}

export default function App() {
  const { loading } = useAuth();
  if (loading) return <FullPageLoader />;

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Stations />
            </PrivateRoute>
          }
        />
        <Route
          path="/stations/:stationId"
          element={
            <PrivateRoute>
              <StationDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/parcelles/:parcelleId/travail"
          element={
            <PrivateRoute>
              <ParcelleWork />
            </PrivateRoute>
          }
        />
        <Route
          path="/parcelles/:parcelleId/tableau"
          element={
            <PrivateRoute>
              <ParcelleTable />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
