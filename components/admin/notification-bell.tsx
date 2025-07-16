"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, writeBatch } from 'firebase/firestore';
import type { AdminNotification } from '@/types';

import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Bell, BellRing, CheckCheck } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function NotificationBell() {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (userProfile?.role !== 'admin') return;

    const q = query(
      collection(db, 'admin_notifications'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotifications = snapshot.docs.map(doc => doc.data() as AdminNotification);
      setNotifications(fetchedNotifications);
    });

    return () => unsubscribe();
  }, [userProfile]);

  const handleNotificationClick = async (notification: AdminNotification) => {
    if (!notification.read) {
      const notifRef = doc(db, 'admin_notifications', notification.id);
      await updateDoc(notifRef, { read: true });
    }
    if (notification.link) {
      router.push(notification.link);
    }
    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    const batch = writeBatch(db);
    const unreadNotifications = notifications.filter(n => !n.read);
    unreadNotifications.forEach(notification => {
      const notifRef = doc(db, 'admin_notifications', notification.id);
      batch.update(notifRef, { read: true });
    });
    await batch.commit();
  };

  if (userProfile?.role !== 'admin') {
    return null;
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? (
            <>
              <BellRing className="h-5 w-5 text-emerald-500 animate-bounce" />
              <Badge className="absolute -top-1 -right-1 h-4 w-4 justify-center rounded-full p-0 text-xs">{unreadCount}</Badge>
            </>
          ) : (
            <Bell className="h-5 w-5" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="flex justify-between items-center p-4 font-semibold border-b">
          Notifications
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="h-auto p-1 text-xs">
              <CheckCheck className="h-3 w-3 mr-1" />
              Tout marquer comme lu
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length > 0 ? (
            notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 border-b hover:bg-accent cursor-pointer ${!notif.read ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}>
                <p className="text-sm">{notif.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {notif.createdAt ? `il y a ${formatDistanceToNow(notif.createdAt.toDate(), { locale: fr })}` : ''}
                </p>
              </div>
            ))
          ) : (
            <p className="p-4 text-sm text-center text-muted-foreground">Aucune notification.</p>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
