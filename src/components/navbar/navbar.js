import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FaUser } from "react-icons/fa";
import { auth } from "../../api/api.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { toast } from "react-toastify";
import Login from "../login/login.js";
import Register from "../register/register.js";
import ResetPassword from "../resetpassword/resetpassword.js";
import EventLoading from "../loading/EventLoading.js";
import "./navbar.css";

const Navbar = ({ onViewChange }) => {
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
  const dropdownButtonRef = useRef(null);
  const [dropdownCoords, setDropdownCoords] = useState({ top: 0, left: 0, width: 180 });

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
    if (!showDropdown) return;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showDropdown]);

  useEffect(() => {
    if (!showDropdown) return;

    const updateDropdownCoords = () => {
      if (!dropdownButtonRef.current) return;
      const rect = dropdownButtonRef.current.getBoundingClientRect();
      setDropdownCoords({
        top: rect.bottom + 10,
        left: rect.left + rect.width / 2,
        width: Math.max(180, rect.width + 24),
      });
    };

    updateDropdownCoords();
    window.addEventListener("resize", updateDropdownCoords);
    window.addEventListener("scroll", updateDropdownCoords, true);

    return () => {
      window.removeEventListener("resize", updateDropdownCoords);
      window.removeEventListener("scroll", updateDropdownCoords, true);
    };
  }, [showDropdown]);

  /* 🔥 Evitar scroll cuando menú está abierto */
  useEffect(() => {
    if (open && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open, isMobile]);

  const updateDropdownPosition = () => {
    if (!dropdownButtonRef.current) return;
    const rect = dropdownButtonRef.current.getBoundingClientRect();
    setDropdownCoords({
      top: rect.bottom + 10,
      left: rect.left + rect.width / 2,
      width: Math.max(180, rect.width + 24),
    });
  };

  const toggleDropdown = () => {
    if (showDropdown) {
      setShowDropdown(false);
      return;
    }

    updateDropdownPosition();
    setShowDropdown(true);
  };

  /* 🔥 Acciones */
  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    setTimeout(async () => {
      await signOut(auth);
      setShowDropdown(false);
      setIsLoggingOut(false);
      toast.success("Sesión cerrada");
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }, 2000);
  };

  const handleMenuClick = () => {
    setOpen(false);
    setShowDropdown(false);
  };

  const handleAuth = (type) => {
    setShowDropdown(false);
    setShowLogin(type === "login");
    setShowRegister(type === "register");
  };

  const dropdownMenu = showDropdown
    ? createPortal(
        <div
          className="dropdown"
          ref={dropdownRef}
          style={{
            top: dropdownCoords.top,
            left: dropdownCoords.left,
            minWidth: dropdownCoords.width,
          }}
        >
          {user ? (
            <>
              <div onClick={() => { onViewChange("profile"); setShowDropdown(false); }}>
                Perfil
              </div>
              <div onClick={handleLogout}>Cerrar sesión</div>
            </>
          ) : (
            <>
              <button onClick={() => handleAuth("register")}>Regístrate</button>
              <button onClick={() => handleAuth("login")}>Inicia sesión</button>
            </>
          )}
        </div>,
        document.body
      )
    : null;

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

            <li>
              {user ? (
                <div className="user-icon-container" ref={dropdownButtonRef}>
                  <FaUser
                    className="user-icon"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleDropdown();
                    }}
                  />
                </div>
              ) : (
                <div className="welcome-button-container" ref={dropdownButtonRef}>
                  <button
                    className="welcome-button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleDropdown();
                    }}
                  >
                    Bienvenido
                  </button>
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
      {dropdownMenu}
    </>
  );
};

export default Navbar;