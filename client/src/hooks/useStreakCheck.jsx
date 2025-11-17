import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/api";

export const useStreakCheck = () => {
  const { user } = useAuth();

  useEffect(() => {
    const checkStreak = async () => {
      if (!user?.id) return;

      try {
        const response = await authService.updateStreak();
        console.log("[v0] Streak check result:", response.data);
      } catch (error) {
        console.error("[v0] Streak check error:", error);
      }
    };

    // Check streak on component mount
    checkStreak();

    // Optionally check every hour to catch day changes
    const interval = setInterval(checkStreak, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user?.id]);
};
