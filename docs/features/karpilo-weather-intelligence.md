# Karpilo Weather Intelligence

## Purpose

Karpilo Weather Intelligence is the server-side weather exposure foundation for
Karpilo LoadIQ. It aligns provider weather data to the load's operating window
and directional route context so weather can be evaluated where the truck is
expected to be, when it is expected to be there.

Weather signals are decision support only. They are not dispatch, brokerage,
ELD, navigation, legal, tax, insurance, DOT, FMCSA, safety-compliance, permit,
or guaranteed-delay authority.

## Provider Roles

- Google Weather API is the primary app-facing forecast and current-weather
  provider for Karpilo Weather Intelligence.
- OpenWeather is the secondary, fallback, and supplemental provider. The
  server-side foundation uses One Call 3.0 for the new provider path while the
  existing weather profitability panel still uses the current OpenWeather 2.5
  service.
- NWS/weather.gov is the official U.S. government validation and alert evidence
  layer. It uses required User-Agent identification and does not use a normal
  API key.

## Load-Window Rule

Karpilo Weather Intelligence must be calculated against Karpilo LoadIQ load
date/time inputs. It must not silently use generic current weather for
future-dated loads.

The load-window utility supports:

- pickup time
- pickup appointment window
- departure time
- delivery time
- delivery appointment window
- origin/destination/fallback timezone labels
- estimated route duration and distance context

If no usable date/time context exists, the foundation returns
`weatherPredictiveStatus: "date_required"`. If only partial timing exists, it
returns `partial_window` with notes. If the load is historical or beyond the
configured forecast range, it returns `historical_unavailable` or
`forecast_window_exceeded`.

## Route Direction Rule

Weather must ride on top of the same directional address-to-address route logic
as Karpilo LoadIQ mileage and profitability analysis.

The route-weather utility:

- uses supplied route checkpoints when available
- falls back to origin/destination coordinates when route geometry is missing
- preserves route direction and checkpoint order
- treats A-to-B and B-to-A as different route weather analyses
- does not create a competing routing provider

Current Route Intelligence does not return polyline geometry. Polyline decoding
is deferred until route geometry is actually available from the route provider
contract. Until then, `routeWeatherCoverage` is either
`origin_destination_only`, `route_segmented` for supplied checkpoints, or
`route_unavailable`.

## Server Modules

- `src/lib/weather/providers/googleWeather.ts`
- `src/lib/weather/providers/openWeather.ts`
- `src/lib/weather/providers/nws.ts`
- `src/lib/weather/weatherTypes.ts`
- `src/lib/weather/weatherNormalize.ts`
- `src/lib/weather/weatherLoadWindow.ts`
- `src/lib/weather/weatherRouteRisk.ts`
- `src/lib/weather/weatherIntelligence.ts`

These modules are server-side. They must not expose provider keys to client
components or `NEXT_PUBLIC_` variables.

## API Routes

- `GET /api/weather/current`
- `GET /api/weather/forecast`
- `GET /api/weather/alerts`
- `GET /api/weather/risk`
- `GET /api/weather/nws/points`
- `GET /api/weather/route-risk`
- `POST /api/weather/route-risk`

The routes return normalized Karpilo Weather Intelligence response shapes and
safe provider configuration/access errors. They do not return raw provider data
by default.

## Google Weather Endpoint Validation

Google Weather calls use these documented endpoint paths:

- `/v1/currentConditions:lookup`
- `/v1/forecast/hours:lookup`
- `/v1/forecast/days:lookup`
- `/v1/publicAlerts:lookup`

The server adapter strips a trailing `/v1` from `GOOGLE_WEATHER_BASE_URL` before
joining endpoint constants so a deployment override cannot accidentally produce
double-version paths such as `/v1/v1/currentConditions:lookup`.

Manual app-route validation on 2026-06-28 returned `ok: true` for current,
hourly forecast, daily forecast, and public alerts without printing or exposing
secret values.

## Risk Categories

Karpilo Weather Intelligence recognizes these trucking weather risk categories:

- high wind
- winter weather
- flooding
- severe storm
- tornado
- fog/visibility
- extreme heat
- extreme cold
- fire weather
- unknown alert

Allowed language: risk, exposure, may impact, possible delay, official alert
evidence.

Disallowed language: guaranteed delay, safe/unsafe route certification,
dispatch instruction, legal route authority, DOT/FMCSA compliance authority,
insurance advice, tax advice, or broker/load-board behavior.

## Persistence Boundary

This foundation does not add saved-load schema fields, Supabase migrations, or
first-class weather persistence. Any future saved-load weather snapshot work
requires a separate schema and reporting branch.

## Provider Contracts

Provider contract details live under `docs/api-contracts/`:

- `google-weather.contract.md`
- `openweather.contract.md`
- `nws-weather.contract.md`
