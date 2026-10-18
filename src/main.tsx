import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Navbar from './NavBar.tsx'
import ProtectedRoute from './App.tsx'
import {createBrowserRouter, RouterProvider, Outlet, } from 'react-router-dom';
import Login from './login.tsx'
import Register from './register.tsx'
import Posts from './posts.tsx'
import Userprofile from './userprofile.tsx'
import Notifications from './usernotifications.tsx'
import PostDetails from './postdetails.tsx'

function Layout() {
  return (
    <>
      <Navbar />

      <div className="flex flex-col min-h-screen bg-[#090909] text-white">
        <main className="flex-grow">
          <Outlet />
        </main>
      </div>
    </>
  );
}

function NotFound() {
  return (
    <div className="flex justify-center items-center py-20 pt-50">
      <p className="font-bold rounded-full bg-red-500 px-10 py-5 text-center">
        404 Not Found
      </p>
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <Login />,
      },
      {
        path: "/home",
        element: <Login />,
      },
      {
        path: "/register",
        element: <Register />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "/home/posts",
            element: <Posts />,
          },
          {
            path: "/home/profile",
            element: <Userprofile />,
          },
          {
            path: "/home/notifications",
            element: <Notifications />,
          },
          {
            path: "/home/posts/:id",
            element: <PostDetails />,
          },
        ],
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);