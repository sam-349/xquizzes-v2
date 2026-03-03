import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import AdminRegister from './pages/AdminRegister';
import Dashboard from './pages/Dashboard';
import CreateTest from './pages/CreateTest';
import TakeTest from './pages/TakeTest';
import TestResult from './pages/TestResult';
import AttemptReview from './pages/AttemptReview';
import Analytics from './pages/Analytics';
import MyTests from './pages/MyTests';
import MyAttempts from './pages/MyAttempts';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminUserReport from './pages/AdminUserReport';
import AdminTests from './pages/AdminTests';
import AdminCreateTest from './pages/AdminCreateTest';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} />;
  }
  return children;
}

function AdminPublicRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  if (isAuthenticated && user?.role === 'admin') return <Navigate to="/admin" />;
  if (isAuthenticated) return <Navigate to="/dashboard" />;
  return children;
}

function AdminRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/admin/login" />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/admin/login" element={<AdminPublicRoute><AdminLogin /></AdminPublicRoute>} />
      <Route path="/admin/register" element={<AdminPublicRoute><AdminRegister /></AdminPublicRoute>} />

      {/* Protected routes */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="create-test" element={<CreateTest />} />
        <Route path="my-tests" element={<MyTests />} />
        <Route path="my-attempts" element={<MyAttempts />} />
        <Route path="test/:testId/take" element={<TakeTest />} />
        <Route path="test/:testId/result" element={<TestResult />} />
        <Route path="attempt/:attemptId/review" element={<AttemptReview />} />
        <Route path="analytics" element={<Analytics />} />

        {/* Admin routes */}
        <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="admin/users/:userId/report" element={<AdminRoute><AdminUserReport /></AdminRoute>} />
        <Route path="admin/tests" element={<AdminRoute><AdminTests /></AdminRoute>} />
        <Route path="admin/create-test" element={<AdminRoute><AdminCreateTest /></AdminRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
