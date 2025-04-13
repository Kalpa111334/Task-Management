import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, GlobalStyles, useTheme } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import Profile from './pages/Profile';
import TaskDetails from './pages/TaskDetails';
import TaskList from './pages/TaskList';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Chat from './pages/Chat';
import Team from './pages/Team';
import NotFound from './pages/NotFound';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import SplashScreen from './components/SplashScreen';

const globalStyles = {
  '*': {
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',
  },
  html: {
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    height: '100%',
    width: '100%',
  },
  body: {
    height: '100%',
    width: '100%',
  },
  '#root': {
    height: '100%',
    width: '100%',
  },
  '::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },
  '::-webkit-scrollbar-track': {
    background: '#f1f1f1',
  },
  '::-webkit-scrollbar-thumb': {
    background: '#888',
    borderRadius: '4px',
  },
  '::-webkit-scrollbar-thumb:hover': {
    background: '#555',
  },
};

const AppContent: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const { user, isLoading } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    // Simulate minimum loading time for smooth transition
    const minLoadingTime = 2000; // 2 seconds
    const loadingTimer = setTimeout(() => {
      if (!isLoading) {
        setLoading(false);
      }
    }, minLoadingTime);

    return () => clearTimeout(loadingTimer);
  }, [isLoading]);

  if (loading || isLoading) {
    return <SplashScreen />;
  }

  return (
    <>
      <CssBaseline />
      <GlobalStyles styles={globalStyles} />
      <Router>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          
          {/* Admin Routes */}
          <Route
            path="/admin"
            element={<Navigate to="/admin/dashboard" replace />}
          />
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute role="admin">
                <Layout>
                  <AdminDashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/tasks"
            element={
              <PrivateRoute role="admin">
                <Layout>
                  <TaskList />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/tasks/:taskId"
            element={
              <PrivateRoute role="admin">
                <Layout>
                  <TaskDetails />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <PrivateRoute role="admin">
                <Layout>
                  <Reports />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/team"
            element={
              <PrivateRoute role="admin">
                <Layout>
                  <Team />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/chat"
            element={
              <PrivateRoute role="admin">
                <Layout>
                  <Chat />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <PrivateRoute role="admin">
                <Layout>
                  <Profile />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <PrivateRoute role="admin">
                <Layout>
                  <Settings />
                </Layout>
              </PrivateRoute>
            }
          />

          {/* Employee Routes */}
          <Route
            path="/employee"
            element={<Navigate to="/employee/dashboard" replace />}
          />
          <Route
            path="/employee/dashboard"
            element={
              <PrivateRoute role="employee">
                <Layout>
                  <EmployeeDashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/employee/tasks"
            element={
              <PrivateRoute role="employee">
                <Layout>
                  <TaskList />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/employee/tasks/:taskId"
            element={
              <PrivateRoute role="employee">
                <Layout>
                  <TaskDetails />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/employee/chat"
            element={
              <PrivateRoute role="employee">
                <Layout>
                  <Chat />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/employee/profile"
            element={
              <PrivateRoute role="employee">
                <Layout>
                  <Profile />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/employee/settings"
            element={
              <PrivateRoute role="employee">
                <Layout>
                  <Settings />
                </Layout>
              </PrivateRoute>
            }
          />

          {/* Default Routes */}
          <Route
            path="/"
            element={
              <PrivateRoute role={user?.role || 'employee'}>
                <Layout>
                  {user?.role === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />}
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute role={user?.role || 'employee'}>
                <Layout>
                  <Profile />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/tasks/:taskId"
            element={
              <PrivateRoute role={user?.role || 'employee'}>
                <Layout>
                  <TaskDetails />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute role={user?.role || 'employee'}>
                <Layout>
                  <Settings />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <PrivateRoute role={user?.role || 'employee'}>
                <Layout>
                  <Reports />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App; 