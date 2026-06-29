import { useAppSettings } from '@/context/AppSettingsContext'
import { STRINGS, type Strings } from './strings'

/**
 * Returns the active-locale string dictionary. Reactive: re-renders consumers
 * when the locale changes (via AppSettingsContext).
 */
export function useStrings(): Strings {
  const { locale } = useAppSettings()
  return STRINGS[locale]
}
