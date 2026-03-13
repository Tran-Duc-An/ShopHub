import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import MainLayout from '@/components/layout/MainLayout'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import SellerRoute from '@/components/layout/SellerRoute'

// Pages
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import ProductListPage from '@/pages/ProductListPage'
import CategoryPage from '@/pages/CategoryPage'
import ProductDetailPage from '@/pages/ProductDetailPage'
import CartPage from '@/pages/CartPage'
import OrdersPage from '@/pages/OrdersPage'
import OrderDetailPage from '@/pages/OrderDetailPage'
import ProfilePage from '@/pages/ProfilePage'
import SellerDashboard from '@/pages/SellerDashboard'
import SellerPage from '@/pages/SellerPage'
import GiftProfilesPage from '@/pages/GiftProfilesPage'
import AIAssistantPage from '@/pages/AIAssistantPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true,               element: <HomePage /> },
      { path: 'products',          element: <ProductListPage /> },
      { path: 'category/:category',element: <CategoryPage /> },
      { path: 'login',             element: <LoginPage /> },
      { path: 'signup',            element: <SignupPage /> },
      { path: 'products/:id',      element: <ProductDetailPage /> },
      { path: 'seller/:sellerId',  element: <SellerPage /> },
      { path: 'cart',        element: <ProtectedRoute><CartPage /></ProtectedRoute> },
      { path: 'orders',      element: <ProtectedRoute><OrdersPage /></ProtectedRoute> },
      { path: 'orders/:id',  element: <ProtectedRoute><OrderDetailPage /></ProtectedRoute> },
      { path: 'profile',     element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },
      { path: 'seller',      element: <SellerRoute><SellerDashboard /></SellerRoute> },
      { path: 'gift-profiles', element: <ProtectedRoute><GiftProfilesPage /></ProtectedRoute> },
      { path: 'ai-assistant',  element: <ProtectedRoute><AIAssistantPage /></ProtectedRoute> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}