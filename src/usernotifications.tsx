
import { useEffect, useState } from "react";
import { Notification, NotificationBing, MessageRemove } from "iconsax-reactjs"
import { useNavigate } from "react-router-dom";


interface Notification {
  _id?: string;
  id?: string;
  title?: string;
  message?: string;
  body?: string;
  type?: string;
  isRead?: boolean;
  createdAt?: string;
  sender?: {
    name?: string;
    image?: string;
  };
}

interface NotificationsResponse {
  data?: Notification[] | { notifications?: Notification[] };
  notifications?: Notification[];
  message?: string;
}


const API_URL =
  "https://route-posts.routemisr.com/notifications?read=false&page=1&limit=50";


export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  
useEffect(() => {
  const controller = new AbortController();

  async function fetchNotifications(isInitial = false) {
    try {
      if (isInitial) {
        setLoading(true);
        setError("");
      }

      const token = localStorage.getItem("token");

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch notifications (${response.status})`
        );
      }

      const result: NotificationsResponse = await response.json();

      const items = Array.isArray(result.data)
        ? result.data
        : result.data?.notifications ??
          result.notifications ??
          [];

      setNotifications((prev) => {
        const existingIds = new Set(
          prev.map((n) => n._id ?? n.id)
        );

        const newItems = items.filter((n) => {
          const id = n._id ?? n.id;
          return id && !existingIds.has(id);
        });

        return newItems.length > 0
          ? [...newItems, ...prev]
          : prev;
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      if (isInitial) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } else {
        console.error("Failed to refresh notifications:", err);
      }
    } finally {
      if (isInitial && !controller.signal.aborted) {
        setLoading(false);
      }
    }
  }

  fetchNotifications(true);

  const interval = setInterval(() => {
    fetchNotifications();
  }, 1000);

  return () => {
    controller.abort();
    clearInterval(interval);
  };
}, []);



const markAsRead = async (id: string) => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `https://route-posts.routemisr.com/notifications/${id}/read`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to mark notification as read");
    }

    setNotifications((prev) =>
      prev.map((notification) =>
        (notification._id ?? notification.id) === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
  } catch (error) {
    console.error(error);
  }
};



  function formatDate(date?: string) {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "";

    return parsedDate.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  
const markAllAsRead = async () => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      "https://route-posts.routemisr.com/notifications/read-all",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to mark all notifications as read");
    }

    // Update the UI without reloading the page
    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        isRead: true,
      }))
    );
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
  }
};



const navigate = useNavigate();
const unreadCount = notifications.filter((n) => !n.isRead).length;


  return (
    <main className="min-h-screen bg-black px-4 py-8 text-gray-300 sm:px-6">
      <div className="mx-auto max-w-3xl">
        
        <div className="mb-8 flex items-center justify-center gap-3">
           <Notification size="80" color="#f47373" variant="TwoTone"/>
          <div>
            <h1 className="text-2xl font-bold text-gray-100 sm:text-3xl">
              Notifications
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Stay updated with your latest activity.
            </p>
          </div>
        </div>

        
        {!loading && !error && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-200">
              All notifications {notifications.length}
            </h2>
            <button type="button"
              className="text-gray-400 cursor-pointer hover:bg-blue-700 rounded-full border-gray-800 w-fit flex px-3 py-1 border
              disabled:cursor-not-allowed disabled:opacity-50"
              disabled={(unreadCount ?? 0) === 0}
              onClick={markAllAsRead}>
              <MessageRemove size="32" color="#2ccce4" variant="Outline" className="mr-3"/>  Mark all as Read 
            </button>
            
            <span className="rounded-full border border-gray-800 ">
            {unreadCount > 0 ? (
        <span className="cursor-pointer text-sm font-bold bg-red-600 hover:text-red-800 px-3 py-1 rounded-full">
          {unreadCount} Unread ! 
        </span>
      ) : (
        <span className="cursor-pointer text-sm font-bold text-cyan-500 hover:text-cyan-700 px-3 py-1">{unreadCount ?? 0} unread
        </span>
      )}
        </span>
          </div>
        )}

        
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-2xl border border-gray-800 bg-gray-950 p-5"
              >
                <div className="mb-4 h-4 w-1/3 rounded bg-gray-800" />
                <div className="mb-2 h-3 w-full rounded bg-gray-800" />
                <div className="h-3 w-2/3 rounded bg-gray-800" />
              </div>
            ))}
          </div>
        )}

       
        {!loading && error && (
          <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-6 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 transition hover:bg-gray-900"
            >
              Try again
            </button>
          </div>
        )}

        
        {!loading && !error && notifications.length === 0 && (
          <div className="rounded-2xl border border-gray-800 bg-gray-950 px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-900">
              <span className="text-2xl text-gray-500"><Notification size="32" color="#f47373" variant="Bold"/></span>
            </div>
            <h3 className="text-lg font-semibold text-gray-200">
              No notifications yet
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              You&apos;re all caught up. Check back later.
            </p>
          </div>
        )}


        
        {!loading && !error && notifications.length > 0 && (
          <div className="space-y-3">
            {notifications.map((notification, index) => (
              <article
                key={notification._id ?? notification.id ?? index}
                onClick={(e) => {
                    navigate(`/home/posts/${notification.entity._id}`)
                        const id = notification._id ?? notification.id;
                          if (id) markAsRead(id);
                        }}
                className="group flex gap-4 rounded-2xl border border-gray-800 bg-gray-950 p-4 transition duration-200 hover:border-gray-700 hover:bg-gray-900/70 sm:p-5"
              >
               <Notification size="32" color="#f47373" variant="Bold"/>

              
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-gray-200 sm:text-base">
                        <p className="">{notification.recipient.name} you  {notification.entityType} </p>
                    </h3>
                     <img src={notification.entity.image} className="w-15 rounded-full"></img>
                    {!notification.isRead && (
                      <span
                        className="mt-1.5 h-2 w-2 rounded-full bg-blue-500"
                        title="Unread"
                      />
                    )}
                  </div>

                  <p className="mt-2 break-words text-sm leading-6 text-gray-400 items-center flex gap-3">
                   <span><img className="w-10 rounded-full" src={notification.actor.photo}></img> </span>
                    <span><p>{notification.type}</p></span>
                    <span>From </span>
                    {notification.actor.name ??
                      notification.body ??
                      "You have a new notification."}
                  </p>

                  {notification.createdAt && (
                    <p className="mt-3 text-sm text-gray-300">
                      {formatDate(notification.createdAt)}
                    </p>
                  )}

                  <div>
                    <button type="button"
                    onClick={(e) => {
                         e.stopPropagation();
                       const id = notification._id ?? notification.id;
                       if (id) markAsRead(id);}}
                       disabled={notification.isRead}
                    className="bg-gray-500 text-gray-300 hover:bg-blue-700 rounded-full m-2 cursor-pointer flex w-full justify-center">
                    <NotificationBing size="24" color="#2ccce4" variant="Bold"/>
                    {notification.isRead ? " Read" : " Mark As Read"}
                    </button>
                  </div>
                  
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>

)
}

