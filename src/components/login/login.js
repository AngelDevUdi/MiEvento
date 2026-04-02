import React, { useState } from "react";
import "./login.css";
import { toast } from "react-toastify";
import { auth } from "../../api/api";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

const Login = ({ onClose, onSwitchToRegister, onSwitchToResetPassword }) => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === "email") value = value.toLowerCase(); //  email limpio

    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (!email) return toast.error("Ingresa tu correo");
    if (!password) return toast.error("Ingresa tu contraseña");

    try {
      setLoading(true);

      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email, password);

      toast.success("Bienvenido");
      setForm({ email: "", password: "" });
      onClose();
    } catch (error) {
      toast.error("Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div
        className="auth-container"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-btn" onClick={onClose}>✕</button>

        <form className="auth-box" onSubmit={handleSubmit}>
          <h2>Bienvenido</h2>
          <p className="subtitle">Inicia sesión para continuar</p>

          {/*  Email */}
          <div className="input-group">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              name="email"
              placeholder=" "
              value={form.email}
              onChange={handleChange}
              required
            />
            <label>Correo electrónico</label>
          </div>

          {/*  Password */}
          <div className="input-group password-group">
            <FaLock className="input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder=" "
              value={form.password}
              onChange={handleChange}
              required
            />
            <label>Contraseña</label>

            <span
              className="toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/*  Botón */}
          <button type="submit" disabled={loading}>
            {loading ? <span className="loader"></span> : "Ingresar"}
          </button>

          <p className="auth-link">
            ¿No tienes cuenta? <span onClick={onSwitchToRegister}>Regístrate</span>
          </p>

          <p className="auth-link small">
            <span onClick={onSwitchToResetPassword}>¿Olvidaste tu contraseña?</span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;