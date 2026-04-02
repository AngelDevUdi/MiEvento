import React, { useState, useEffect, useRef } from "react";
import { FaUser } from "react-icons/fa";
import { auth } from "../../api/api.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { toast } from "react-toastify";
import Login from "../login/login.js";
import Register from "../register/register.js";
import ResetPassword from "../resetpassword/resetpassword.js";
import EventLoading from "../loading/EventLoading.js";
import "./navbar.css";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const dropdownRef = useRef(null);

  /* 🔥 Detectar usuario */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  /* 🔥 Detectar resize */
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* 🔥 Detectar scroll */
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* 🔥 Click fuera */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* 🔥 Acciones */
  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    setTimeout(async () => {
      await signOut(auth);
      setShowDropdown(false);
      setIsLoggingOut(false);
      toast.success("Sesión cerrada");
    }, 2000);
  };

  const handleMenuClick = () => {
    setOpen(false);
  };

  const handleAuth = (type) => {
    setShowLogin(type === "login");
    setShowRegister(type === "register");
  };

  return (
    <>
      {isLoggingOut && <EventLoading text="Cerrando sesión..." />}
      {showLogin && (
        <Login
          onClose={() => setShowLogin(false)}
          onSwitchToRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
          onSwitchToResetPassword={() => {
            setShowLogin(false);
            setShowResetPassword(true);
          }}
        />
      )}
      {showRegister && (
        <Register
          onClose={() => setShowRegister(false)}
          onSwitchToLogin={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
        />
      )}
      {showResetPassword && (
        <ResetPassword
          onClose={() => setShowResetPassword(false)}
          onSwitchToLogin={() => {
            setShowResetPassword(false);
            setShowLogin(true);
          }}
        />
      )}

      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="navbar-container">

          {/* 🔥 Logo */}
          <div className="navbar-logo">MiEvento</div>

          {/* 🔥 Menú */}
          <ul className={`navbar-menu ${open ? "active" : ""}`}>
            <li><a href="/" onClick={(e) => { e.preventDefault(); window.location.reload(); handleMenuClick(); }}>Inicio</a></li>
            <li><a href="#eventos" onClick={handleMenuClick}>Eventos</a></li>

            <li ref={dropdownRef}>
              {user ? (
                <div
                  className="user-icon-container"
                  onClick={() => setShowDropdown(true)}
                >
                  <FaUser className="user-icon" />

                  {showDropdown && (
                    <div className="dropdown">
                      <div>Perfil</div>
                      <div onClick={handleLogout}>Cerrar sesión</div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="welcome-button-container"
                  onClick={() => setShowDropdown(true)}
                >
                  <button className="welcome-button">Bienvenido</button>

                  {showDropdown && (
                    <div className="dropdown">
                      <button onClick={() => handleAuth("register")}>
                        Regístrate
                      </button>
                      <button onClick={() => handleAuth("login")}>
                        Inicia sesión
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          </ul>

          {/* 🔥 Hamburguesa */}
          <div
            className={`hamburger ${open ? "active" : ""}`}
            onClick={() => setOpen(!open)}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>

        </div>
      </nav>
    </>
  );
};

export default Navbar;