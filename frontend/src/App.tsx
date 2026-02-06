import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import './components/Layout.css';
import Home from './pages/Home';
import './pages/Home.css';
import Login from './pages/Login';
import './pages/Login.css';
import Register from './pages/Register';
import Donor from './pages/Donor';
import './pages/Donor.css';
import Ngo from './pages/Ngo';
import './pages/Ngo.css';
import Impact from './pages/Impact';
import './pages/Impact.css';
import Admin from './pages/Admin';
import './pages/Admin.css';

function RequireAuth({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: 'donor' | 'ngo' | 'admin';
}) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/login" element={<Layout><Login /></Layout>} />
      <Route path="/register" element={<Layout><Register /></Layout>} />
      <Route path="/impact" element={<Layout><Impact /></Layout>} />
      <Route
        path="/donor"
        element={
          <Layout>
            <RequireAuth role="donor"><Donor /></RequireAuth>
          </Layout>
        }
      />
      <Route
        path="/ngo"
        element={
          <Layout>
            <RequireAuth role="ngo"><Ngo /></RequireAuth>
          </Layout>
        }
      />
      <Route
        path="/admin"
        element={
          <Layout>
            <RequireAuth role="admin"><Admin /></RequireAuth>
          </Layout>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
