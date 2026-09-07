import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { AlertProvider } from './context/AlertContext';
import './index.css';
import './App.css';

// Layout Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AdminSidebar from './components/layout/AdminSidebar';
import AlertModal from './components/ui/AlertModal';

// Customer Pages
import HomePage from './pages/customer/HomePage';
import MenuPage from './pages/customer/MenuPage';
import CustomOrderPage from './pages/customer/CustomOrderPage';
import GalleryPage from './pages/customer/GalleryPage';
import CartPage from './pages/customer/CartPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import AuthPage from './pages/AuthPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import InventoryPage from './pages/admin/InventoryPage';
import OrdersPage from './pages/admin/OrdersPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import HappyHourPage from './pages/admin/HappyHourPage';
import AlertsPage from './pages/admin/AlertsPage';

// Customer layout wrapper
function CustomerLayout() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

// Admin layout wrapper with route guard
function AdminLayout() {
  const { isAdmin, loading, user } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /><p>Loading...</p></div>;
  if (!user) {
    // Temporarily commented out for development/demo due to email rate limits!
    // return <Navigate to="/auth" replace />;
  }
  if (!isAdmin) {
    // Show demo admin for development (allows any logged-in user to access admin)
    // In production, uncomment: return <Navigate to="/" replace />;
  }
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-content">
        <AlertModal />
        <Outlet />
      </main>
    </div>
  );
}

// App root with all providers
function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Page (standalone) */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Customer Routes */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/custom-order" element={<CustomOrderPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="happy-hours" element={<HappyHourPage />} />
          <Route path="alerts" element={<AlertsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AlertProvider>
          <AppRoutes />
        </AlertProvider>
      </CartProvider>
    </AuthProvider>
  );
}
