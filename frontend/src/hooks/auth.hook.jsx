import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { getPendingRegistration, removePendingRegistration, savePendingRegistration } from "../utils/offlineRegister";
import api, { setAccessToken } from "../config/AxiosInstance";

export const useLogin = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setError("");
    setIsLoading(true);

    try {
      const response = await api.post("/api/auth/login", {
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });

      setAccessToken(response.data.accessToken);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      navigate("/main");
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed. Please check your credentials.";
      setError(msg);
      console.error("LOGIN ERROR:", err.response?.data || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    register,
    handleSubmit,
    onSubmit,
    errors,
    navigate,
    isLoading,
    error,
  };
};

export const useRegister = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  // Prevent duplicate registration requests
  const isSyncingRef = useRef(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const syncRegistration = async () => {
    const pendingUser = getPendingRegistration();

    if (!pendingUser || !navigator.onLine) return;

    if (isSyncingRef.current) return;

    isSyncingRef.current = true;
    setIsSyncing(true);
    setMessage("Internet connected. Registering your account...");

    try {
      await api.post("/api/auth/register", pendingUser);
      removePendingRegistration();

      setMessage("Registration successful! Please log in.");
      navigate("/", { replace: true });
    } catch (error) {
      console.error(
        "Registration sync error:",
        error.response?.data || error.message
      );

      const errorMessage =
        error.response?.data?.errors?.[0]?.message ||
        error.response?.data?.message;

      if (error.response?.status === 409 || errorMessage?.includes("already")) {
        removePendingRegistration();
        setMessage("Account already exists. Please log in.");
        navigate("/", { replace: true });
        return;
      }

      setMessage(errorMessage || "Registration failed. Please try again.");
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      console.log("Internet connected!");
      syncRegistration();
    };

    window.addEventListener("online", handleOnline);
    syncRegistration();

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const onSubmit = async (data) => {
    if (!navigator.onLine) {
      savePendingRegistration(data);
      setMessage(
        "You are offline. Your registration will be submitted automatically when internet returns."
      );
      return;
    }

    try {
      await api.post("/api/auth/register", data);
      removePendingRegistration();

      setMessage("Registration successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 1200);
    } catch (error) {
      console.error(
        "Registration error:",
        error.response?.data || error.message
      );

      const errorMsg =
        error.response?.data?.errors?.[0]?.message ||
        error.response?.data?.message ||
        "Registration failed.";

      setMessage(errorMsg);
    }
  };

  return {
    message,
    onSubmit,
    handleSubmit,
    errors,
    register,
    watch,
    isSyncing,
    navigate,
  };
};

export const useAuth = () => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const syncUser = () => {
      try {
        const stored = localStorage.getItem("user");
        setUser(stored ? JSON.parse(stored) : null);
      } catch {
        setUser(null);
      }
    };

    window.addEventListener("storage", syncUser);
    window.addEventListener("session-expired", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("session-expired", syncUser);
    };
  }, []);

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // Ignore network errors on logout
    } finally {
      setAccessToken(null);
      localStorage.removeItem("user");
      localStorage.removeItem("pendingRegistration");
      setUser(null);
    }
  };

  return {
    user,
    isAuthenticated: !!user,
    isSeller: user?.role === "seller",
    isCustomer: user?.role === "customer",
    isUser: user?.role === "customer" || user?.role === "user",
    role: user?.role,
    logout,
  };
};