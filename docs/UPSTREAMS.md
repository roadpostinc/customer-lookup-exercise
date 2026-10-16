# Upstream API usage

These are independent, read-only synthetic systems. Both listen locally, use JSON, and require different credentials. All timestamps are UTC ISO 8601 strings. No real credentials are required.

## CRM

Send `X-CRM-Key: demo-crm-key` with each data request.

| Request | Response |
| --- | --- |
| GET /crm/accounts?offset=0&limit=3 | { records: CrmAccount[], next_offset: number or null } |
| GET /crm/accounts/by-reference/{customerRef} | { records: CrmAccount[] }; 404 if none |

CrmAccount fields are crm_id, customer_ref, full_name, email_address, account_state (active or inactive). By-reference lookup returns every matching CRM record and is not paginated. Listing is ordered by customer_ref then crm_id, both ascending. Default limit is 3; allowed range 1 to 3. Offset is a nonnegative integer; next_offset null ends enumeration. Empty lists are 200 responses. Invalid pagination is 400.

## Billing

Send `Authorization: Bearer demo-billing-token` with each data request.

| Request | Response |
| --- | --- |
| GET /billing/accounts?pageSize=3 | { items: BillingAccount[], nextCursor: string or null } |
| GET /billing/accounts/by-reference/{customerRef} | { account: BillingAccount }; 404 if absent |
| GET /billing/accounts/{accountId}/invoices?pageSize=3 | { items: Invoice[], nextCursor: string or null }; 404 if account absent |

BillingAccount has accountId, externalCustomerRef, and subscriptions. Each subscription has subscription_id, plan_code, lifecycle (active or cancelled), starts_at, and nullable ends_at. At most one subscription is current at the exercise clock; historical subscriptions may be present.

Invoice has invoiceId, accountId, issuedAt, dueAt, currencyCode (USD), totalMinor, outstandingMinor, and paymentAttempts. Amounts are nonnegative integers in minor currency units. Payment attempts contain attemptedAt and result (failed or succeeded), ordered oldest first. A zero outstanding balance is settled even if there was an earlier failed attempt.

Account listing is ordered by externalCustomerRef ascending. Invoice listing is ordered by issuedAt descending, then invoiceId ascending, across pages. Default pageSize is 3; allowed range 1 to 3. Send the returned cursor unchanged, URL-encoded, with subsequent requests. Cursors are scoped to their collection and must not be reused across accounts or endpoint types. Do not decode them in your integration. nextCursor null ends traversal. Empty collections return 200; invalid cursors/page sizes return 400. The fixtures are immutable during a run, so pagination is stable.

## Errors

Data errors have `{ "error": "description" }`. Missing or wrong credentials return 401. Missing customers/accounts return 404; listing endpoints do not return 404 for empty collections. Fault profiles can return 503 or 429, or delay otherwise ordinary responses. Retry-After is expressed as integer seconds. A timeout in your client is not proof that a record is missing.

## Mock controls

The controls below are a local exercise convenience, not part of the upstream business APIs. Send `X-Mock-Admin-Key: demo-admin-key`. They are included in each OpenAPI document under mockAdministration.

| Request | Result |
| --- | --- |
| GET /health | Public service health, unaffected by profiles |
| POST /__admin/profile with JSON { "profile": "healthy" } | Select profile and reset counters on that provider |
| GET /__admin/state | Current profile and authenticated data-request counts |

Allowed profiles are healthy, crm-timeout, crm-transient, billing-rate-limit, and billing-down. Profiles aimed at the other provider have no effect. The CLI sets the same profile on both providers. Each provider's counters are independent, keyed by HTTP method and the exact path plus query string, so pagination URLs have their own counters. Keep query ordering stable for retries. Auth failures, health requests, and admin requests do not consume fault counts. Reset the profile to repeat a scenario. Delayed responses take 1500 ms; aborting a request cancels the pending response on the server.

```sh
curl -X POST http://127.0.0.1:4101/__admin/profile \
  -H 'Content-Type: application/json' -H 'X-Mock-Admin-Key: demo-admin-key' \
  -d '{"profile":"crm-transient"}'
curl -H 'X-Mock-Admin-Key: demo-admin-key' http://127.0.0.1:4101/__admin/state
```

Use `npm run fault -- healthy` to restore both providers. The smoke script verifies health, authentication, and an initial page from each provider; it does not verify your implementation.
