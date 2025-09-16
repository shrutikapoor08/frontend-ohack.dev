import { useState, useEffect, useCallback } from "react";

/**
 * Hook for fetching public profile data for a specific user
 * Respects privacy settings and only returns data marked as public
 */
export default function usePublicProfile(userId) {
  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState(null);
  const [hackathons, setHackathons] = useState(null);
  const [feedbackUrl, setFeedbackUrl] = useState("");
  const [privacySettings, setPrivacySettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPublicProfile = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch the basic profile data
      const profileResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/messages/profile/${userId}`,
      );

      if (!profileResponse.ok) {
        throw new Error(`Failed to fetch profile: ${profileResponse.status}`);
      }

      const profileData = await profileResponse.json();
      setProfile(profileData);

      // Try to fetch privacy settings for this user
      // This might fail if the backend doesn't support it yet, which is fine
      try {
        const privacyResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/users/profile/privacy/${userId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (privacyResponse.ok) {
          const privacyData = await privacyResponse.json();
          setPrivacySettings(privacyData);
        } else {
          // Default to all public if no privacy settings found
          setPrivacySettings({
            github_username: "public",
            current_role: "public",
            current_company: "public",
            why_are_you_here: "public",
            badges: "public",
            feedback: "public",
            what: "public",
            how: "public",
            hackathon_history: "public",
          });
        }
      } catch (privacyError) {
        console.log("Privacy settings not available, defaulting to public");
        // Default to all public if privacy endpoint doesn't exist
        setPrivacySettings({
          github_username: "public",
          current_role: "public",
          current_company: "public",
          why_are_you_here: "public",
          badges: "public",
          feedback: "public",
          what: "public",
          how: "public",
          hackathon_history: "public",
        });
      }

      // Set feedback URL for this user
      setFeedbackUrl(`/feedback/${userId}`);

      // For now, we'll use the existing profile data structure
      // In the future, we might want separate endpoints for badges and hackathons
      setBadges(profileData.badges || []);
      setHackathons(profileData.hackathons || []);
    } catch (err) {
      console.error("Error fetching public profile:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchPublicProfile();
    }
  }, [userId, fetchPublicProfile]);

  return {
    profile,
    badges,
    hackathons,
    feedbackUrl,
    privacySettings,
    isLoading,
    error,
    refetch: fetchPublicProfile,
  };
}
