import { LineupService, LineupServiceImpl } from '../services/LineupService';
import { PlayerService } from '../services/PlayerService';
import { MusicService } from '@/modules/music/services/MusicService';
import { StorageService } from '@/modules/storage';

const lineupServiceProvider = (() => {
  let instance: LineupService;

  return {
    getOrCreate(
      playerService: PlayerService,
      musicService: MusicService,
      storageService: StorageService
    ): LineupService {
      if (!instance) {
        instance = new LineupServiceImpl(
          playerService,
          musicService,
          storageService
        );
      }
      return instance;
    },
  };
})();

export default lineupServiceProvider;
