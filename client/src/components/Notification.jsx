import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Book,
  MessageCircle,
  BookOpen,
  Trophy,
  X,
} from "lucide-react";

const API_BASE_URL = "/api";

const iconMap = {
  bell: Bell,
  "check-circle": CheckCircle,
  "alert-triangle": AlertTriangle,
  "x-circle": XCircle,
  clock: Clock,
  book: Book,
  "message-circle": MessageCircle,
  "book-open": BookOpen,
  trophy: Trophy,
};

const colorMap = {
  info: "bg-blue-50 border-blue-200 text-blue-800",
  success: "bg-green-50 border-green-200 text-green-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  error: "bg-red-50 border-red-200 text-red-800",
};

export default function Notification() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 20 },
      });
      setNotifications(response.data.data.notifications || []);
      setUnreadCount(response.data.data.unreadCount || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(`${API_BASE_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnreadCount(response.data.data.count || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("authToken");
      await axios.put(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("authToken");
      await axios.put(
        `${API_BASE_URL}/notifications/read-all`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem("authToken");
      await axios.delete(`${API_BASE_URL}/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " vite më parë";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " muaj më parë";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " ditë më parë";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " orë më parë";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minuta më parë";
    return Math.floor(seconds) + " sekonda më parë";
  };

  return (
    <div className="relative">
      {/* Bell Icon with Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[600px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <h3 className="text-lg font-semibold">Njoftime</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm hover:underline text-white"
              >
                Shëno të gjitha si të lexuara
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Duke ngarkuar...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nuk ka njoftime</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = iconMap[notification.icon] || Bell;
                return (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !notification.isRead ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          colorMap[notification.color] || colorMap.info
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm text-gray-900">
                            {notification.title}
                          </h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification._id);
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
}