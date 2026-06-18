import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import ActivityFeed from './components/ActivityFeed';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Login from './pages/Login';

function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-navy-900">
      <Sidebar />
      <main className="flex-1 flex">
        <div className="flex-1 flex flex-col">{children}</div>
        <ActivityFeed />
      </main>
    </div>
  );
}

function PlaceholderPage({ title }) {
  return (
    <div className="flex-1 p-7">
      <h1 className="text-[22px] font-medium text-gray-100">{title}</h1>
      <p className="text-xs text-gray-500 mt-1">Coming soon</p>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout><Dashboard /></MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoices"
            element={
              <ProtectedRoute>
                <MainLayout><PlaceholderPage title="Invoices" /></MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <MainLayout><History /></MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <MainLayout><PlaceholderPage title="Reports" /></MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <MainLayout><PlaceholderPage title="Settings" /></MainLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}