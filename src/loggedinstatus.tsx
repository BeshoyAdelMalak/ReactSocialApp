
import Userdata from "./UserData"
import { Link } from "react-router-dom"
import { useState, useEffect } from "react";

export default function loggedin(){


 const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(localStorage.getItem("token"))
  );

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(Boolean(localStorage.getItem("token")));
    };

    window.addEventListener("auth-change", checkAuth);
    window.addEventListener("storage", checkAuth);

    checkAuth();

    return () => {
      window.removeEventListener("auth-change", checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, []);


    return isAuthenticated ? (<Userdata />) : (<Link to='/home' className="rounded-3xl bg-cyan-600 px-4 py-2 text-white hover:bg-cyan-700">Log in</Link>);
}
