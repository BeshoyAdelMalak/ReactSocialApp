import "./App.css";
import { Ghost, Menu, Xrp, } from "iconsax-reactjs";
import { Link } from "react-router-dom";
import Loginstatus from './loggedinstatus'
import { useEffect, useState  } from "react";


export default function Navbar() {
  
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-500 bg-gray-500 shadow-sm">
  <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
    <Link to="/home/posts" className="shrink-0">
      <Ghost
        size="55"
        color="#2ccce4"
        variant="Outline"
        className="cursor-pointer"
      />
    </Link>

    <div className="hidden items-center gap-5 sm:flex">
      <Link
        to="/home/posts"
        className="text-cyan-500 transition hover:text-cyan-700"
      >
        Feed
      </Link>

      <Link
        to="/home/profile"
        className="text-cyan-500 transition hover:text-cyan-700"
      >
        Profile
      </Link>

      <Link to="/home/notifications">
        <NotificationNavButton />
      </Link>
    </div>

    <div className="hidden items-center sm:flex">
      <Loginstatus />
    </div>
      <div className="absolute left-1/2 -translate-x-1/2 sm:hidden">
  <Link
    to="/home/notifications"
    onClick={() => setMobileMenuOpen(false)}
  >
    <NotificationNavButton />
  </Link>
</div>
    <button
      type="button"
      className="rounded-lg p-2 text-cyan-400 hover:bg-gray-600 sm:hidden"
      onClick={() => setMobileMenuOpen((prev) => !prev)}
      aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
      aria-expanded={mobileMenuOpen}
    >
      {mobileMenuOpen ? (
        <Xrp size="28" color="#2ccce4" />
      ) : (
        <Menu size="28" color="#2ccce4" />
      )}
    </button>
  </div>

  {mobileMenuOpen && (
    <div className="border-t border-gray-400 px-4 py-4 sm:hidden">
      <div className="flex flex-col gap-4">
        <Link
          to="/home/posts"
          onClick={() => setMobileMenuOpen(false)}
          className="text-cyan-400 transition hover:text-cyan-600"
        >
          Feed
        </Link>

        <Link
          to="/home/profile"
          onClick={() => setMobileMenuOpen(false)}
          className="text-cyan-400 transition hover:text-cyan-600"
        >
          Profile
        </Link>

        

        <div className="border-t border-gray-400 pt-3">
          <button type="button" className="w-full" onClick={() => setMobileMenuOpen(false)}>
            <Loginstatus  />
          </button>
          
        </div>
      </div>
    </div>
  )}
</nav>
  );
}


function NotificationNavButton(){
  interface Notification {
  isRead: boolean;

}
  const [notifications, setNotifications] = useState<Notification[]>([]);
 const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("You must be logged in.");
        return;
      }

      const response = await fetch(
        "https://route-posts.routemisr.com/notifications?unread=false&page=1&limit=10",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch notifications: ${response.status}`
        );
      }

      const result = await response.json();

      const items = Array.isArray(result.data)
        ? result.data
        : result.data?.notifications ??
          result.notifications ??
          [];

      setNotifications(items);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
 
  fetchNotifications();

  const interval = setInterval(() => {
    fetchNotifications();
  }, 1000);

  
  return () => clearInterval(interval);
}, []);

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;


  // const unreadCount = notifications.filter((n) => !n.isRead).length;
  return(
    <button type="button" className="flex items-center gap-2">
  
      {unreadCount > 0 ? (
        <span className="cursor-pointer rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white">
          {unreadCount} Notifications 
        </span>
      ) : (
        <span className=" text-cyan-500 hover:text-cyan-700">Notifications</span>
      )}
    </button>
  )
};