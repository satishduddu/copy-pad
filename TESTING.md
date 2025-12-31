# Testing Guide

This document provides instructions for testing all functionality of the Pastebin-Lite application.

## Prerequisites

- Application is running locally or deployed
- Curl or similar HTTP client for API testing
- Browser for UI testing

## Environment Setup

### Local Testing
```bash
npm run dev
```
App will be available at: `http://localhost:5173`
API will be accessed via Supabase Edge Functions

### Test Mode
To enable deterministic time testing, set environment variable:
```bash
export TEST_MODE=1
```

Then include the `x-test-now-ms` header in requests:
```bash
curl -H "x-test-now-ms: 1704067200000" ...
```

## API Testing

### 1. Health Check

**Test that database connectivity works:**
```bash
curl https://<your-project>.supabase.co/functions/v1/healthz
```

**Expected Response:**
```json
{
  "ok": true
}
```

### 2. Create Paste - Basic

**Create a simple paste with no constraints:**
```bash
curl -X POST https://<your-project>.supabase.co/functions/v1/create-paste \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello, World!"}'
```

**Expected Response:**
```json
{
  "id": "abc123",
  "url": "https://your-domain.com/p/abc123"
}
```

### 3. Create Paste - With TTL

**Create a paste that expires in 60 seconds:**
```bash
curl -X POST https://<your-project>.supabase.co/functions/v1/create-paste \
  -H "Content-Type: application/json" \
  -d '{
    "content": "This expires soon",
    "ttl_seconds": 60
  }'
```

### 4. Create Paste - With Max Views

**Create a paste with 5 view limit:**
```bash
curl -X POST https://<your-project>.supabase.co/functions/v1/create-paste \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Limited views",
    "max_views": 5
  }'
```

### 5. Create Paste - With Both Constraints

**Create a paste with both TTL and max views:**
```bash
curl -X POST https://<your-project>.supabase.co/functions/v1/create-paste \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Double constraints",
    "ttl_seconds": 3600,
    "max_views": 10
  }'
```

### 6. Fetch Paste

**Fetch a paste by ID:**
```bash
curl https://<your-project>.supabase.co/functions/v1/fetch-paste/<paste-id>
```

**Expected Response:**
```json
{
  "content": "Hello, World!",
  "remaining_views": 4,
  "expires_at": "2026-01-01T00:00:00.000Z"
}
```

**Note:** `remaining_views` and `expires_at` will be `null` if not set.

### 7. View Decrement Test

**Create a paste with max_views=3 and fetch it 4 times:**

1. Create paste:
```bash
PASTE_URL=$(curl -X POST https://<your-project>.supabase.co/functions/v1/create-paste \
  -H "Content-Type: application/json" \
  -d '{"content": "Test views", "max_views": 3}' | jq -r '.url')
```

2. Fetch 3 times (should succeed):
```bash
for i in {1..3}; do
  curl $PASTE_URL/api/fetch-paste/$(echo $PASTE_URL | grep -oP '(?<=/p/)[^/]+')
  echo ""
done
```

3. Fetch 4th time (should return 404):
```bash
curl $PASTE_URL/api/fetch-paste/$(echo $PASTE_URL | grep -oP '(?<=/p/)[^/]+')
```

**Expected:** First 3 succeed with decreasing `remaining_views`, 4th returns 404.

### 8. TTL Expiration Test with TEST_MODE

**Using test mode to simulate time passing:**

1. Create paste with 60 second TTL:
```bash
curl -X POST https://<your-project>.supabase.co/functions/v1/create-paste \
  -H "Content-Type: application/json" \
  -H "x-test-now-ms: 1704067200000" \
  -d '{"content": "TTL test", "ttl_seconds": 60}'
```

2. Fetch immediately (should succeed):
```bash
curl https://<your-project>.supabase.co/functions/v1/fetch-paste/<paste-id> \
  -H "x-test-now-ms: 1704067200000"
```

3. Fetch after expiration (should fail):
```bash
curl https://<your-project>.supabase.co/functions/v1/fetch-paste/<paste-id> \
  -H "x-test-now-ms: 1704067261000"
```

**Expected:** First fetch succeeds, second returns 404.

## Input Validation Testing

### Invalid Content

**Empty content:**
```bash
curl -X POST https://<your-project>.supabase.co/functions/v1/create-paste \
  -H "Content-Type: application/json" \
  -d '{"content": ""}'
```
**Expected:** 400 error

### Invalid TTL

**Negative TTL:**
```bash
curl -X POST https://<your-project>.supabase.co/functions/v1/create-paste \
  -H "Content-Type: application/json" \
  -d '{"content": "test", "ttl_seconds": -1}'
```
**Expected:** 400 error

**Zero TTL:**
```bash
curl -X POST https://<your-project>.supabase.co/functions/v1/create-paste \
  -H "Content-Type: application/json" \
  -d '{"content": "test", "ttl_seconds": 0}'
```
**Expected:** 400 error

### Invalid Max Views

**Negative max_views:**
```bash
curl -X POST https://<your-project>.supabase.co/functions/v1/create-paste \
  -H "Content-Type: application/json" \
  -d '{"content": "test", "max_views": -1}'
```
**Expected:** 400 error

## UI Testing

### Create Paste Flow

1. Navigate to home page
2. Enter content in textarea
3. Optionally set TTL and/or max views
4. Click "Create Paste"
5. Verify success page shows URL
6. Verify "Copy" button works
7. Click "Create Another Paste" to return

### View Paste Flow

1. Open a paste URL in browser
2. Verify content is displayed correctly
3. Verify expiration info is shown (if set)
4. Verify remaining views is shown (if set)
5. Click "Create New Paste" to return home

### Error Handling

1. Try accessing non-existent paste: `/p/invalid123`
2. Verify 404 error page is shown
3. Create paste with max_views=1
4. View it once, then view again
5. Verify second view shows 404

## Concurrent Access Testing

To test atomic view decrement under concurrent load:

```bash
# Create a paste with max_views=10
PASTE_ID=$(curl -X POST https://<your-project>.supabase.co/functions/v1/create-paste \
  -H "Content-Type: application/json" \
  -d '{"content": "Concurrent test", "max_views": 10}' | jq -r '.id')

# Fetch concurrently 10 times
for i in {1..10}; do
  curl https://<your-project>.supabase.co/functions/v1/fetch-paste/$PASTE_ID &
done
wait

# 11th fetch should fail
curl https://<your-project>.supabase.co/functions/v1/fetch-paste/$PASTE_ID
```

**Expected:** All 10 concurrent fetches succeed, 11th returns 404. View count should never go negative.

## Automated Test Checklist

- [ ] Health check returns `{"ok": true}`
- [ ] Create paste with content only
- [ ] Create paste with TTL only
- [ ] Create paste with max_views only
- [ ] Create paste with both constraints
- [ ] Fetch paste returns correct data
- [ ] View count decrements correctly
- [ ] View count stops at 0
- [ ] TTL expiration works
- [ ] Empty content returns 400
- [ ] Invalid TTL returns 400
- [ ] Invalid max_views returns 400
- [ ] Non-existent paste returns 404
- [ ] Expired paste returns 404
- [ ] Exhausted paste returns 404
- [ ] TEST_MODE respects x-test-now-ms header
- [ ] UI creates pastes successfully
- [ ] UI displays pastes correctly
- [ ] UI shows error states
- [ ] Concurrent fetches are atomic

## Performance Testing

For production readiness, consider testing:

1. **Load testing:** Create and fetch 1000+ pastes
2. **Stress testing:** Concurrent access to same paste
3. **Database limits:** Very long content (test limits)
4. **Edge cases:** Max integer values for TTL and views

## Security Testing

1. **XSS Prevention:** Create paste with HTML/JS content, verify safe rendering
2. **SQL Injection:** Try SQL in content field
3. **Rate limiting:** (if implemented) Test rapid requests
4. **CORS:** Verify cross-origin requests work correctly
