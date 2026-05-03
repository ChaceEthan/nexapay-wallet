export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return false;

  if (Notification.permission === "granted") return true;

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

export const triggerPush = (title, body) => {
  if (Notification.permission === "granted") {
    try {
      new Notification(title, {
        body,
        icon: "/logo.png", // Ensure nexapay logo is in public folder
      });
    } catch (e) {
      console.error("Push failed:", e);
    }
  }
};