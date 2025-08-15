import { AppConfigSupplier } from './AppConfigSupplier';

export function useMaxSegmentSeconds(): number {
  return AppConfigSupplier.get().maxSegmentSeconds;
}
