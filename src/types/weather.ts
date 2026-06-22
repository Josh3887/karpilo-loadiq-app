export type WeatherUnits = "imperial" | "metric" | "standard";

export type WeatherProviderId = "openweather_free" | "mock_weather";

export type WeatherFailureCode =
  | "invalid_coordinates"
  | "missing_openweather_api_key"
  | "invalid_openweather_api_key"
  | "openweather_rate_limited"
  | "openweather_http_error"
  | "openweather_network_error"
  | "openweather_payload_error";

export type WeatherLookupInput = {
  latitude: number;
  longitude: number;
  units?: WeatherUnits;
  language?: string;
};

export type WeatherLocation = {
  latitude: number;
  longitude: number;
  name: string | null;
  country: string | null;
  timezoneOffsetSeconds: number | null;
};

export type WeatherCondition = {
  id: number | null;
  main: string | null;
  description: string | null;
  icon: string | null;
};

export type WeatherTemperature = {
  value: number | null;
  feelsLike: number | null;
  min: number | null;
  max: number | null;
  unit: "F" | "C" | "K";
};

export type WeatherWind = {
  speed: number | null;
  gust: number | null;
  degrees: number | null;
  unit: "mph" | "m/s";
};

export type WeatherPrecipitation = {
  rain1hMm: number | null;
  rain3hMm: number | null;
  snow1hMm: number | null;
  snow3hMm: number | null;
  probability: number | null;
};

export type CurrentWeatherSnapshot = {
  providerId: WeatherProviderId;
  sourceLabel: string;
  location: WeatherLocation;
  units: WeatherUnits;
  observedAt: string | null;
  fetchedAt: string;
  condition: WeatherCondition;
  temperature: WeatherTemperature;
  humidityPercent: number | null;
  pressureHpa: number | null;
  visibilityMeters: number | null;
  cloudsPercent: number | null;
  wind: WeatherWind;
  precipitation: WeatherPrecipitation;
};

export type WeatherForecastPoint = {
  forecastedAt: string;
  condition: WeatherCondition;
  temperature: WeatherTemperature;
  humidityPercent: number | null;
  pressureHpa: number | null;
  visibilityMeters: number | null;
  cloudsPercent: number | null;
  wind: WeatherWind;
  precipitation: WeatherPrecipitation;
};

export type FiveDayWeatherForecast = {
  providerId: WeatherProviderId;
  sourceLabel: string;
  location: WeatherLocation;
  units: WeatherUnits;
  fetchedAt: string;
  intervalHours: 3;
  points: WeatherForecastPoint[];
};

export type WeatherProviderSuccess<TData> = {
  status: "available";
  providerId: WeatherProviderId;
  data: TData;
  message: string;
  fetchedAt: string;
};

export type WeatherProviderFailure = {
  status: "unavailable";
  providerId: WeatherProviderId;
  code: WeatherFailureCode;
  message: string;
  safeMessage: string;
  retryable: boolean;
  httpStatus: number | null;
  fetchedAt: string;
};

export type WeatherProviderResult<TData> =
  | WeatherProviderSuccess<TData>
  | WeatherProviderFailure;

export type WeatherProvider = {
  readonly id: WeatherProviderId;
  getCurrentWeather(
    input: WeatherLookupInput
  ): Promise<WeatherProviderResult<CurrentWeatherSnapshot>>;
  getFiveDayForecast(
    input: WeatherLookupInput
  ): Promise<WeatherProviderResult<FiveDayWeatherForecast>>;
};
