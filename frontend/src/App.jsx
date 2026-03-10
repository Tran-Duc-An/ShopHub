import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './App.css';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import ProductListPage from './pages/ProductListPage';
import CategoryPage from './pages/CategoryPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ProfilePage from './pages/ProfilePage';
import SellerDashboard from './pages/SellerDashboard';
import SellerPage from './pages/SellerPage';
import ProtectedRoute from './components/ProtectedRoute';
import SellerRoute from './components/SellerRoute';
import MainLayout from './layouts/MainLayout';
import GiftProfilesPage from './pages/GiftProfilesPage';
import AIAssistantPage from './pages/AIAssistantPage';

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "products", element: <ProductListPage /> },
      { path: "category/:category", element: <CategoryPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },
      { path: "products/:id", element: <ProductDetailPage /> },
      { path: "seller/:sellerId", element: <SellerPage /> },
      {
        path: "cart",
        element: <ProtectedRoute><CartPage /></ProtectedRoute>
      },
      {
        path: "orders",
        element: <ProtectedRoute><OrdersPage /></ProtectedRoute>
      },
      {
        path: "orders/:id",
        element: <ProtectedRoute><OrderDetailPage /></ProtectedRoute>
      },
      {
        path: "profile",
        element: <ProtectedRoute><ProfilePage /></ProtectedRoute>
      },
      {
        path: "seller",
        element: <SellerRoute><SellerDashboard /></SellerRoute>
      },
      {
        path: "gift-profiles",
        element: <ProtectedRoute><GiftProfilesPage /></ProtectedRoute>
      },
      {
        path: "ai-assistant",
        element: <ProtectedRoute><AIAssistantPage /></ProtectedRoute>
      }
    ]
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;