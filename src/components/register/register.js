import React, { useState } from "react";
import "./register.css";
import { toast } from "react-toastify";
import { auth, db } from "../../api/api";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

/* 🔐 Seguridad PRO */
const getPasswordStrength = (password) => {
  if (!password) return { label: "", score: 0 };

  const length = password.length;

  if (length < 10) return { label: "Muy débil", score: 1 };
  if (length < 15) return { label: "Débil", score: 2 };
  if (length < 20) return { label: "Media", score: 3 };
  if (length < 30) return { label: "Fuerte", score: 4 };

  return { label: "Muy fuerte", score: 5 };
};

const Register = ({ onClose, onSwitchToLogin }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === "name") value = value.toUpperCase();
    if (name === "email") value = value.toLowerCase();

    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, email, password, confirmPassword } = form;

    if (!name) return toast.error("Ingresa tu nombre");
    if (!email) return toast.error("Ingresa tu correo");
    if (password !== confirmPassword)
      return toast.error("Las contraseñas no coinciden");
    if (password.length < 10)
      return toast.error("Mínimo 10 caracteres");

    try {
      setLoading(true);

      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(userCredential.user, {
        displayName: name,
      });

      await setDoc(doc(db, "USUARIOS", userCredential.user.uid), {
        name: name,
        email: email,
        rol: "USUARIO"
      });

      toast.success("Cuenta creada");
      onClose();
    } catch (error) {
      toast.error("Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(form.password);

  const getWidth = (password) => {
    const lengths = { 10: 25, 15: 50, 20: 75, 30: 100 };
    const length = password.length;

    if (length < 10) return `${(length / 10) * 25}%`;
    if (length < 15) return `${25 + ((length - 10) / 5) * 25}%`;
    if (length < 20) return `${50 + ((length - 15) / 5) * 25}%`;
    if (length < 30) return `${75 + ((length - 20) / 10) * 25}%`;

    return "100%";
  };

  const colors = {
    "Muy débil": "#ff4d4d",
    Débil: "#ff944d",
    Media: "#ffd11a",
    Fuerte: "#00e676",
    "Muy fuerte": "#00ffcc",
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-container" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✕</button>

        <form className="auth-box" onSubmit={handleSubmit}>
          <h2>Crear cuenta</h2>
          <p className="subtitle">Únete y empieza ahora</p>

          {/* Nombre */}
          <div className="input-group">
            <FaUser className="input-icon" />
            <input
              type="text"
              name="name"
              placeholder=" "
              value={form.name}
              onChange={handleChange}
              required
            />
            <label>Nombre completo</label>
          </div>

          {/* Email */}
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

          {/* Password */}
          <div className="input-group">
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

          {/*  Barra seguridad */}
          {strength.label && (
            <>
              <div className="strength-bar">
                <div
                  className="strength-fill"
                  style={{
                    width: getWidth(form.password),
                    background: colors[strength.label],
                  }}
                ></div>
              </div>

              <p
                className="password-strength"
                style={{ color: colors[strength.label] }}
              >
                {strength.label}
              </p>
            </>
          )}

          {/* Confirm */}
          <div className="input-group">
            <FaLock className="input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder=" "
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
            <label>Confirmar contraseña</label>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? <span className="loader"></span> : "Registrarse"}
          </button>

          <p className="auth-link">
            ¿Ya tienes cuenta? <span onClick={onSwitchToLogin}>Inicia sesión</span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;