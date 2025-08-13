export { AppConfig } from '@/modules/app/models/AppConfig';
export type { AppConfig as AppConfigType } from '@/modules/app/models/AppConfig';
export { AppConfigSupplier as AppConfigProvider } from '@/modules/app/suppliers/AppConfigSupplier';
// Do not re-export service hooks; prefer suppliers directly
