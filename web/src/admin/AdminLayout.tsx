import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import "../styles/admin.css";
import { SITE_NAME } from "../config";
import { AdminProvider, errText, useAdmin } from "./AdminContext";

const POLL_MS = 45000; // як часто перевіряти нові замовлення

function Login() {
  const { login } = useAdmin();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(password);
    } catch (err) {
      setError(errText(err));
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <img src="/img/logo-wide.jpg" alt={SITE_NAME} />
        <h1>Вхід у кабінет</h1>
        <label className="field">Пароль
          <input type="password" autoComplete="current-password" required autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button className="btn btn-gold" type="submit" disabled={busy}>Увійти</button>
        <p className="login-err" role="alert">{error}</p>
        <Link className="login-back" to="/">← Повернутися на сайт</Link>
      </form>
    </div>
  );
}

function Shell() {
  const { logout, newCount, refreshOrders } = useAdmin();
  const { pathname } = useLocation();
  const onProducts = pathname.startsWith("/admin/products");

  // лічильник нових замовлень оновлюється сам
  useEffect(() => {
    refreshOrders();
    const t = setInterval(() => { if (!document.hidden) refreshOrders(true); }, POLL_MS);
    return () => clearInterval(t);
  }, [refreshOrders]);

  return (
    <>
      <title>{(newCount ? `(${newCount}) ` : "") + "Кабінет — " + SITE_NAME}</title>
      <header className="top">
        <div className="wrap top-row">
          <Link className="top-brand" to="/admin"><img src="/img/logo-mark.jpg" alt="" /><span>Кабінет</span></Link>
          <nav className="tabs" aria-label="Розділи">
            <Link className="tab" to="/admin" aria-current={onProducts ? "false" : "page"}>
              Замовлення {newCount > 0 && <span className="badge">{newCount}</span>}
            </Link>
            <Link className="tab" to="/admin/products" aria-current={onProducts ? "page" : "false"}>Рослини</Link>
          </nav>
          <button className="logout" type="button" onClick={logout}>Вийти</button>
        </div>
      </header>
      <main className="wrap" id="view"><Outlet /></main>
    </>
  );
}

function Root() {
  const { token, toastMsg } = useAdmin();
  return (
    <div className="admin">
      {token ? <Shell /> : <Login />}
      {toastMsg && <div className={"toast" + (toastMsg.isError ? " err" : "")} role="status">{toastMsg.text}</div>}
    </div>
  );
}

export default function AdminLayout() {
  return (
    <AdminProvider>
      <Root />
    </AdminProvider>
  );
}
