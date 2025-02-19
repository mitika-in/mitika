export class Settings {
  async get(key: string, defaultValue: any): Promise<any> {
    let val = window.localStorage.getItem(key);
    if (val == null) return defaultValue;
    return JSON.parse(val);
  }

  async set(key: string, value: any) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}

let settings: Settings;

export async function useSettings(): Promise<Settings> {
  if (!settings) settings = new Settings();
  return settings;
}
