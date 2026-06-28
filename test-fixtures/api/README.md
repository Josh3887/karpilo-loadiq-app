# API Fixture Scaffolds

These directories reserve mock fixture locations for future API contract tests.
Do not commit real provider payloads containing secrets, account identifiers,
customer data, route/customer locations, payment identifiers, or raw operational
records.

## Naming Rules

- Success fixtures: `capability.success.json`
- Malformed fixtures: `capability.malformed.json`
- Error fixtures: `errors/error-type.json`

Live provider calls are not required for normal CI. Fixture updates should be
reviewed against the matching `docs/api-contracts/` provider contract.

