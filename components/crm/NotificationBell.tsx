"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Wrench,
  CheckCircle2,
  XCircle,
  Briefcase,
  AlertCircle,
  Loader2,
  DollarSign,
  PackageCheck,
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

function NotificationSkeleton() {
  return (
    <div className="divide-y divide-gray-100 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-3.5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-gray-200 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-3.5 bg-gray-200 rounded-md w-1/2" />
              <div className="h-2.5 bg-gray-100 rounded-md w-12" />
            </div>
            <div className="h-3 bg-gray-100 rounded-md w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async (pageNum = 1, isInitial = false) => {
    try {
      if (isInitial) setInitialLoading(true);
      else if (pageNum > 1) setIsLoadingMore(true);

      const res = await fetch(`/api/crm/notifications?page=${pageNum}&limit=15`);
      if (res.ok) {
        const data = await res.json();
        if (pageNum === 1) {
          setNotifications(data.notifications || []);
        } else {
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const newItems = (data.notifications || []).filter(
              (n: NotificationItem) => !existingIds.has(n.id)
            );
            return [...prev, ...newItems];
          });
        }
        setUnreadCount(data.unreadCount || 0);
        setHasMore(data.hasMore || false);
        setPage(pageNum);
      }
    } catch (err) {
      console.error("Erreur chargement notifications:", err);
    } finally {
      setInitialLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(1, true);

    const handleRealtimeEvent = () => {
      fetchNotifications(1, false);
    };

    window.addEventListener("crm:realtime-event", handleRealtimeEvent);
    const interval = setInterval(() => fetchNotifications(1, false), 60000);

    return () => {
      window.removeEventListener("crm:realtime-event", handleRealtimeEvent);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  // Fermer le menu lors d'un clic extérieur ou appui sur Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Infinite Scroll Trigger
  const handleScroll = () => {
    if (!scrollContainerRef.current || !hasMore || isLoadingMore || initialLoading) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 30) {
      fetchNotifications(page + 1, false);
    }
  };

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
    setIsMarkingAll(true);
    try {
      await fetch("/api/crm/notifications", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, estLu: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Erreur marquage global:", err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "TICKET_CREE":
        return <AlertCircle className="w-4 h-4 text-brand-blue" />;
      case "TICKET_ASSIGNE":
        return <Wrench className="w-4 h-4 text-brand-green" />;
      case "STATUT_CHANGE":
        return <PackageCheck className="w-4 h-4 text-brand-green" />;
      case "DEVIS_ACCEPTE":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case "DEVIS_REFUSE":
        return <XCircle className="w-4 h-4 text-brand-red" />;
      case "DEMANDE_COMMERCIALE":
        return <Briefcase className="w-4 h-4 text-purple-600" />;
      case "FACTURE_PAYEE":
        return <DollarSign className="w-4 h-4 text-emerald-600" />;
      case "SYSTEME":
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
        onClick={() => {
          const nextState = !isOpen;
          setIsOpen(nextState);
          if (nextState && notifications.length === 0) {
            fetchNotifications(1, true);
          }
        }}
        aria-label="Notifications"
        className="relative p-2 rounded-xl text-gray-600 hover:text-brand-dark hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-brand-red text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panneau déroulant des notifications (Responsive Centré & Clé en main) */}
      {isOpen && (
        <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-white rounded-3xl shadow-2xl border border-gray-200 p-0 z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden flex flex-col max-h-[80vh]">
          {/* Header du panneau */}
          <div className="p-3.5 bg-brand-slate/80 border-b border-gray-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs text-brand-dark">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-brand-red/10 text-brand-red font-bold text-[10px] px-2 py-0.5 rounded-full">
                  {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll}
                className="text-[11px] font-bold text-brand-blue hover:text-brand-blue-dark flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isMarkingAll ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5" />
                )}
                <span>Tout marquer lu</span>
              </button>
            )}
          </div>

          {/* Module d'activation des notifications Push */}
          <div className="p-2 border-b border-gray-100 bg-white shrink-0">
            <PushSubscriptionManager />
          </div>

          {/* Liste des notifications avec Scroll & Skeleton */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto divide-y divide-gray-50 min-h-[140px] max-h-80"
          >
            {initialLoading ? (
              <NotificationSkeleton />
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 space-y-2">
                <Bell className="w-7 h-7 mx-auto text-gray-300 stroke-[1.5]" />
                <p className="font-medium">Aucune notification pour le moment.</p>
              </div>
            ) : (
              <>
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleMarkAsRead(item.id, item.lien)}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer text-left hover:bg-gray-50 ${
                      !item.estLu ? "bg-brand-blue-light/25" : ""
                    }`}
                  >
                    <div className="mt-0.5 shrink-0 p-1.5 rounded-xl bg-white border border-gray-100 shadow-2xs">
                      {getNotificationIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span
                          className={`text-xs truncate ${
                            !item.estLu
                              ? "font-extrabold text-brand-dark"
                              : "font-semibold text-gray-800"
                          }`}
                        >
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
                ))}

                {/* Indicateur de chargement au scroll infini */}
                {isLoadingMore && (
                  <div className="p-3 text-center text-xs text-gray-500 flex items-center justify-center gap-2 bg-gray-50">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-blue" />
                    <span>Chargement des anciennes notifications...</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
