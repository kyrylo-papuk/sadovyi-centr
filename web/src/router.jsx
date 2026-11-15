import { Navigate } from "react-router-dom";
import ShopLayout from "./shop/ShopLayout.jsx";
import HomePage from "./shop/HomePage.jsx";
import ProductPage from "./shop/ProductPage.jsx";
import OfertaPage from "./pages/OfertaPage.jsx";
import AdminLayout from "./admin/AdminLayout.jsx";
import OrdersPage from "./admin/OrdersPage.jsx";
import OrderPage from "./admin/OrderPage.jsx";
import ProductsPage from "./admin/ProductsPage.jsx";
import ProductEditor from "./admin/ProductEditor.jsx";

export const routes = [
  {
    path: "/",
    element: <ShopLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "product/:id", element: <ProductPage /> },
    ],
  },
  { path: "/oferta", element: <OfertaPage /> },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <OrdersPage /> },
      { path: "orders/:id", element: <OrderPage /> },
      { path: "products", element: <ProductsPage /> },
      { path: "products/new", element: <ProductEditor key="new" /> },
      { path: "products/:id", element: <ProductEditor key="edit" /> },
    ],
  },
  // адреси старої версії сайту
  { path: "/index.html", element: <Navigate to="/" replace /> },
  { path: "/admin.html", element: <Navigate to="/admin" replace /> },
  { path: "/oferta.html", element: <Navigate to="/oferta" replace /> },
  { path: "*", element: <Navigate to="/" replace /> },
];
