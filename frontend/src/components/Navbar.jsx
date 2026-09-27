import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useAuth } from "../hooks/auth.hook";
import ProfileModal from "./ProfileModal";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isSeller, logout } = useAuth();
  const navRef = useRef(null);
  const profileDropdownRef = useRef(null);

  // States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useGSAP(
    () => {
      if (navRef.current) {
        gsap.fromTo(
          navRef.current,
          { y: -30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: "power2.out",
            clearProps: "all",
          }
        );
      }
    },
    { scope: navRef }
  );

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logout();
    navigate("/");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const navLinkClass = ({ isActive }) =>
    `font-medium transition-colors ${
      isActive
        ? "text-lime-600 font-semibold"
        : "text-gray-700 hover:text-lime-600"
    }`;

  return (
    <>
      <nav
        ref={navRef}
        className="w-full border-b border-gray-200 bg-white sticky top-0 z-30 shadow-xs"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5">
          {/* Logo */}
          <NavLink
            to="/main"
            className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight transition hover:scale-105"
          >
            Shery<span className="text-lime-500">Cart</span>
          </NavLink>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink to="/main" end className={navLinkClass}>
              Home
            </NavLink>

            <NavLink to="/main/product" className={navLinkClass}>
              Products
            </NavLink>

            <NavLink to="/main/about" className={navLinkClass}>
              About
            </NavLink>
          </div>

          {/* Profile & User Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user && (
              <div className="relative" ref={profileDropdownRef}>
                {/* Profile Trigger Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen((prev) => !prev);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 sm:gap-2.5 rounded-full border border-gray-200 bg-white p-1 sm:p-1.5 sm:pr-3 shadow-2xs hover:bg-gray-50 hover:border-gray-300 transition active:scale-98"
                >
                  {/* Avatar circle */}
                  <div
                    className={`relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-2xs ${
                      isSeller
                        ? "bg-gradient-to-tr from-lime-600 to-emerald-500"
                        : "bg-gradient-to-tr from-blue-600 to-indigo-500"
                    }`}
                  >
                    {getInitials(user.name)}
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                  </div>

                  {/* Name and Role text */}
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-gray-900 leading-tight">
                      {user.name}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      {isSeller ? "Seller" : "Customer"}
                    </span>
                  </div>

                  {/* Dropdown Chevron */}
                  <svg
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180 text-gray-700" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Profile Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-200 bg-white py-2 shadow-2xl z-50 animate-fade-in">
                    {/* Header in dropdown */}
                    <div className="border-b border-gray-100 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white shadow-xs ${
                            isSeller
                              ? "bg-gradient-to-tr from-lime-600 to-emerald-500"
                              : "bg-gradient-to-tr from-blue-600 to-indigo-500"
                          }`}
                        >
                          {getInitials(user.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user.email}
                          </p>
                          <span
                            className={`mt-1 inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                              isSeller
                                ? "bg-lime-100 text-lime-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {isSeller ? "Seller" : "Customer"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Menu links */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsProfileModalOpen(true);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-lime-50 hover:text-lime-800 transition"
                      >
                        <svg
                          className="h-4 w-4 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <span>View Full Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          navigate("/main/product");
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-lime-50 hover:text-lime-800 transition"
                      >
                        <svg
                          className="h-4 w-4 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                          />
                        </svg>
                        <span>
                          {isSeller ? "Manage Products" : "Marketplace Products"}
                        </span>
                      </button>
                    </div>

                    {/* Logout Option in dropdown */}
                    <div className="border-t border-gray-100 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                      >
                        <svg
                          className="h-4 w-4 text-red-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Toggle Button (md:hidden) */}
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen((prev) => !prev);
                setIsDropdownOpen(false);
              }}
              aria-label="Toggle navigation menu"
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 transition active:scale-95 shadow-2xs"
            >
              {isMobileMenuOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-2.5 pb-4 shadow-lg animate-fade-in space-y-1">
            <NavLink
              to="/main"
              end
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-lime-50 text-lime-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`
              }
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Home</span>
            </NavLink>

            <NavLink
              to="/main/product"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-lime-50 text-lime-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`
              }
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>Products</span>
            </NavLink>

            <NavLink
              to="/main/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-lime-50 text-lime-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`
              }
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>About</span>
            </NavLink>
          </div>
        )}
      </nav>

      {/* Account Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        isSeller={isSeller}
        onLogout={handleLogout}
      />
    </>
  );
};

export default Navbar;
