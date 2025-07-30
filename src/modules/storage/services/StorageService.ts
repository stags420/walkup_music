// Storage abstraction for future backend integration

export interface StorageService {
  save<T>(key: string, data: T): Promise<void>;
  load<T>(key: string): Promise<T | null>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  export(): Promise<string>; // JSON export
  import(data: string): Promise<void>; // JSON import
}
