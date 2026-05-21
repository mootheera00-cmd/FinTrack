import { useContext } from 'react';
import { DataContext } from '@/context/DataContext';

export function useProfile() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useProfile must be used within a DataProvider');
  }

  return {
    profile: context.profile,
    loading: context.loading.profile,
    error: context.error.profile,
    updateProfile: context.updateProfile,
    refetch: context.refetchProfile,
  };
}
