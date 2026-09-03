"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  ExternalLink,
  Wrench,
  UserCheck,
  CheckCircle2,
  XCircle,
  Briefcase,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { NotificationType } from "@prisma/client";
import { PushSubscriptionManager } from "@/components/pwa/PushSubscriptionManager";

interface NotificationItem {
  id: string;
  titre: string;
  message: string;
  type: NotificationType;
  lien?: string | null;
  estLu: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/crm/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Erreur chargement notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Rafraîchissement automatique toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fermer le menu lors d'un clic extérieur
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, lien?: string | null) => {
    try {
      await fetch(`/api/crm/notifications/${id}`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, estLu: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (lien) {
        setIsOpen(false);
        router.push(lien);
      }
    } catch (err) {
      console.error("Erreur marquage notification lue:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    try {
      await fetch("/api/crm/notifications", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, estLu: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Erreur marquage global:", err);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "TICKET_CREE":
        return <AlertCircle className="w-4 h-4 text-brand-blue" />;
      case "TICKET_ASSIGNE":
        return <Wrench className="w-4 h-4 text-brand-green" />;
      case "DEVIS_ACCEPTE":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case "DEVIS_REFUSE":
        return <XCircle className="w-4 h-4 text-brand-red" />;
      case "DEMANDE_COMMERCIALE":
        return <Briefcase className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    return `Il y a ${diffDays} j`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton Cloche avec Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className="relative p-2 rounded-xl text-gray-600 hover:text-brand-dark hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-brand-red text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panneau déroulant des notifications */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 p-0 z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
          {/* Header du panneau */}
          <div className="p-3.5 bg-brand-slate/60 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs text-brand-dark">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-brand-red/10 text-brand-red font-bold text-[10px] px-1.5 py-0.5 rounded-full">
                  {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="text-[11px] font-bold text-brand-blue hover:text-brand-blue-dark flex items-center gap-1 transition-colors"
              >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                <span>Tout marquer comme lu</span>
              </button>
            )}
          </div>

          {/* Module d'activation des notifications Push */}
          <div className="p-2 border-b border-gray-100">
            <PushSubscriptionManager />
          </div>

          {/* Liste des notifications */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 space-y-1">
                <Bell className="w-6 h-6 mx-auto text-gray-300 stroke-[1.5]" />
                <p>Aucune notification pour le moment.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleMarkAsRead(item.id, item.lien)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer text-left hover:bg-gray-50 ${
                    !item.estLu ? "bg-brand-blue-light/20" : ""
                  }`}
                >
                  <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-white border border-gray-100 shadow-2xs">
                    {getNotificationIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={`text-xs truncate ${!item.estLu ? "font-extrabold text-brand-dark" : "font-semibold text-gray-800"}`}>
                        {item.titre}
                      </span>
                      <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                  {!item.estLu && (
                    <span className="w-2 h-2 rounded-full bg-brand-blue shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
