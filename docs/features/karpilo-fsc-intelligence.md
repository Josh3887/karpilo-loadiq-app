# Karpilo FSC Intelligence

## Purpose

Karpilo FSC Intelligence estimates, separates, and explains fuel surcharge
behavior inside the Karpilo LoadIQ calculator and Karpilo Atlas Intelligence
Readout.

It is financial-literacy intelligence, fuel-purchasing discipline intelligence,
load-scoring context, and Karpilo Atlas readout context.

It is not a guaranteed contractual FSC calculator, tax advice, accounting
advice, legal advice, carrier contract authority, broker authority, dispatch
authority, or guaranteed profitability.

Required disclaimer:

```text
Fuel surcharge rules vary by carrier, broker, customer, contract, and
individual load. When actual FSC is not provided, Karpilo LoadIQ uses an
adopted baseline FSC model for estimation and education only. Actual
user-entered FSC remains the source of truth when provided.
```

## EIA Reuse Boundary

Karpilo FSC Intelligence reuses the existing Karpilo LoadIQ EIA diesel baseline
already consumed by the calculator fuel-price field.

It does not add:

- a new EIA provider
- a new EIA client
- new EIA environment variables
- new EIA fetch, cache, or fallback logic
- live provider calls outside the existing fuel-price path

If the EIA diesel baseline is unavailable, the existing manual fuel-price
fallback remains active and FSC confidence is reduced.

## Baseline FSC Model

The adopted Karpilo FSC baseline model is:

| Input | Value |
| --- | ---: |
| Base diesel price | `$1.20/gal` |
| Base FSC | `$0.00/mi` |
| Fuel step | `$0.06/gal` |
| FSC step | `$0.01/paid mile` |

Formula:

```text
fuelDelta = max(0, dieselPrice - 1.20)
fscSteps = floor(fuelDelta / 0.06)
estimatedFscCpm = fscSteps * 0.01
```

Examples:

- `$1.20/gal` diesel -> `$0.00/mi` estimated FSC
- `$1.26/gal` diesel -> `$0.01/mi` estimated FSC
- `$4.20/gal` diesel -> `$0.50/mi` estimated FSC

## Source Modes

Karpilo FSC Intelligence supports these source modes:

| Mode | Meaning | Revenue behavior |
| --- | --- | --- |
| `actual_fsc_entered` | User entered actual FSC amount. | User-entered FSC remains source of truth. Baseline FSC is still calculated for comparison. |
| `fsc_built_into_gross` | FSC is included in gross revenue but not listed separately. | Baseline FSC is estimated and separated from linehaul. |
| `fsc_separate_missing` | FSC is separate from gross but the amount is missing. | Baseline FSC is estimated and added to modeled total revenue. |
| `unknown` | FSC treatment is unknown. | FSC context is education-only and confidence is reduced. |

## Mileage And Cost Rules

FSC revenue is based on paid loaded miles.

Fuel cost is based on total projected miles:

```text
totalProjectedMiles = paidLoadedMiles + deadheadMiles + outOfRouteMiles
```

Out-of-route miles may use existing Route Intelligence variance when available.
Karpilo FSC Intelligence must not invent a new route variance model.

Core calculations:

```text
fscRevenue = paidLoadedMiles * fscCpm
estimatedGallons = totalProjectedMiles / mpg
eiaFuelCost = estimatedGallons * eiaDieselPrice
eiaFuelCpm = eiaDieselPrice / mpg
effectiveFscCpm = fscRevenue / totalProjectedMiles
fuelBudgetDelta = fscRevenue - eiaFuelCost
fuelBudgetDeltaCpm = effectiveFscCpm - eiaFuelCpm
fscCoverageRatio = fscRevenue / eiaFuelCost
```

The calculator must avoid `NaN`, `Infinity`, negative estimated FSC CPM, and
negative actual FSC unless a future approved deduction/chargeback path is
defined.

## Atlas Readout Placement

Karpilo FSC Intelligence appears inside the existing Karpilo Atlas Intelligence
Readout, primarily under `Fuel & Cost Exposure`.

It should show:

- FSC treatment/source mode
- estimated or actual FSC revenue
- EIA-indexed fuel cost
- fuel budget delta
- fuel budget delta per mile
- FSC coverage ratio
- effective FSC CPM
- EIA fuel CPM
- net-positive or net-negative FSC status
- short literacy message

Detailed assumptions, warnings, and the disclaimer belong in the existing
expandable details area.

Karpilo FSC Intelligence must not create another competing top-level readout.

## Scoring Influence

FSC can influence the existing load score as one bounded factor:

- strong positive when FSC coverage is at or above `1.00`
- slight positive when coverage is at or above `0.90`
- caution when coverage is at or above `0.75`
- weak when coverage is below `0.75`

FSC must not overpower core profitability, true RPM, fuel cost, mileage, and
deadhead signals.
