import { useState, useEffect, useCallback } from 'react';
import { UserProfileService, UserProfile } from '../services/userProfileService';
import { processAvatarImage } from '../utils/imageHelper';

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile>(UserProfileService.getProfile());

  useEffect(() => {
    // Initial load
    setProfile(UserProfileService.getProfile());

    // Listen for changes (e.g. from other tabs or components)
    const unsubscribe = UserProfileService.subscribe(() => {
      setProfile(UserProfileService.getProfile());
    });

    return unsubscribe;
  }, []);

  const updateName = useCallback((name: string) => {
    UserProfileService.saveProfile({ displayName: name });
  }, []);

  const updateAvatar = useCallback(async (file: File) => {
    try {
      // Validate type
      if (!file.type.match(/image\/(jpeg|png|webp)/)) {
        alert('Formato inválido. Use JPG, PNG ou WebP.');
        return;
      }

      const dataUrl = await processAvatarImage(file);
      UserProfileService.saveProfile({ avatarDataUrl: dataUrl });
    } catch (e) {
      console.error(e);
      alert('Erro ao processar imagem.');
    }
  }, []);

  const removeAvatar = useCallback(() => {
    UserProfileService.saveProfile({ avatarDataUrl: null });
  }, []);

  return {
    profile,
    updateName,
    updateAvatar,
    removeAvatar
  };
};
