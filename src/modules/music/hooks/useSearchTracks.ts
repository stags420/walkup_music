import { useQuery } from '@tanstack/react-query';
import { supplyMusicService } from '@/modules/music/suppliers/MusicServiceSupplier';

export function useSearchTracks(query: string) {
  const music = supplyMusicService();
  return useQuery({
    queryKey: ['tracks', 'search', query],
    queryFn: async () => {
      if (!query.trim()) return [] as const;
      return await music.searchTracks(query.trim());
    },
    staleTime: 30_000,
    enabled: Boolean(query.trim()),
    retry: false,
  });
}
