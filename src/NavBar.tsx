import "./App.css";
import { Ghost } from "iconsax-reactjs";
import { Link } from "react-router-dom";
import Loginstatus from './loggedinstatus'
import { useEffect, useState  } from "react";


export default function Navbar() {
  

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-500 bg-gray-500 shadow-sm flex items-center">
        <div className="h-16 ml-10">
            <Link to='/home/posts' className=""><Ghost
              size="55"
              color="#2ccce4"
              variant="Outline"
              className="cursor-pointer"
            /></Link>
        </div>
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 justify-center items-center">
         <div className="cursor-pointer flex gap-5">
          <Link to='/home/posts' className=" text-cyan-500 hover:text-cyan-700">Feed</Link>
          <Link to='/home/profile' className=" text-cyan-500 hover:text-cyan-700">Profile</Link>
          <Link to='/home/notifications'><NotificationNavButton /></Link>
         </div>
      </div>
      

          <div className="items-center mr-10">
            <Loginstatus></Loginstatus>
          </div>
    </nav>
  );
}


function NotificationNavButton(){
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