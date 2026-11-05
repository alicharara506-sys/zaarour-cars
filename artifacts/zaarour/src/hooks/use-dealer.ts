import { useQuery } from '@tanstack/react-query';
import { fetchCars, fetchMakes, fetchSettings } from '@/lib/data';
import { defaultSettings } from '@/lib/settings';
import { isPublic } from '@/lib/format';

export const useCars = () => useQuery({ queryKey: ['cars'], queryFn: fetchCars, staleTime: 60_000 });
export const useMakes = () => useQuery({ queryKey: ['makes'], queryFn: fetchMakes, staleTime: 300_000 });
export const useSettings = () => {
  const q = useQuery({ queryKey: ['settings'], queryFn: fetchSettings, staleTime: 300_000 });
  return q.data ?? defaultSettings;
};
export function usePublicCars() {
  const q = useCars();
  return { ...q, cars: (q.data ?? []).filter(isPublic) };
}
