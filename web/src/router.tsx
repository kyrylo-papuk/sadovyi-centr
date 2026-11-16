import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import ShopLayout from "./shop/ShopLayout";
import HomePage from "./shop/HomePage";
import ProductPage from "./shop/ProductPage";
import OfertaPage from "./pages/OfertaPage";
import AdminLayout from "./admin/AdminLayout";
import OrdersPage from "./admin/OrdersPage";
import OrderPage from "./admin/OrderPage";
import ProductsPage from "./admin/ProductsPage";
import ProductEditor from "./admin/ProductEditor";

export const routes: RouteObject[] = [
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
