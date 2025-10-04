# Rate Limit Handling & Retry Logic

## 🚨 Problem

When Cerebras experiences high traffic, API calls return a `429` error:
```json
{
  "status": 429,
  "error": {
    "message": "We're experiencing high traffic right now! Please try again soon.",
    "type": "too_many_requests_error",
    "code": "queue_exceeded"
  }
}
```

This breaks the user experience and shows error messages.

---

## ✅ Solution: Intelligent Retry with Exponential Backoff

We implemented automatic retry logic that:
1. **Detects rate limit errors** (429 status)
2. **Automatically retries** with increasing delays
3. **Provides user-friendly messages** if all retries fail
4. **Logs retry attempts** for debugging

---

## 🔧 Implementation

### 1. Retry Configuration
```javascript
const RETRY_CONFIG = {
  maxRetries: 3,           // Try up to 3 times
  initialDelayMs: 1000,    // Start with 1 second delay
  maxDelayMs: 5000,        // Cap at 5 seconds
  backoffMultiplier: 2,    // Double delay each retry
};
```

**Retry Timeline:**
- Attempt 1: Immediate
- Attempt 2: After 1 second (if 429)
- Attempt 3: After 2 seconds (if 429)
- Attempt 4: After 4 seconds (if 429)
- Final: Return error if all fail

### 2. Retry Helper Function
```javascript
async function retryWithBackoff(apiCall, retries = RETRY_CONFIG.maxRetries) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      const isRateLimit = error.status === 429 || 
                          (error.error && error.error.type === 'too_many_requests_error');
      const isLastAttempt = attempt === retries;

      if (isRateLimit && !isLastAttempt) {
        const delay = Math.min(
          RETRY_CONFIG.initialDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
          RETRY_CONFIG.maxDelayMs
        );
        
        console.log(`Rate limit hit. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${retries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw error; // Re-throw if not rate limit or last attempt
    }
  }
}
```

### 3. Applied to All API Calls

#### Plan Generation:
```javascript
const chatCompletion = await retryWithBackoff(async () => {
  return await client.chat.completions.create({
    model: currentModel,
    messages: [...],
    temperature: 0.7,
    max_tokens: 1000,
  });
});
```

#### Coaching/Suggestions:
```javascript
const chatCompletion = await retryWithBackoff(async () => {
  return await client.chat.completions.create({
    model: coachModel,
    messages: [...],
    temperature: 0.7,
    max_tokens: 600,
  });
});
```

### 4. User-Friendly Error Messages

#### Before:
```
Error: Failed to generate AI plan.
```

#### After:
```json
{
  "success": false,
  "error": "Cerebras is experiencing high traffic. Please try again in a moment.",
  "retryable": true
}
```

---

## 📊 How It Works (Flow Diagram)

```
User clicks "Generate Plan"
    ↓
Frontend sends request to backend
    ↓
Backend calls Cerebras API
    ↓
┌─────────────────┐
│ API Returns 429 │
└─────────────────┘
    ↓
Wait 1 second
    ↓
Retry attempt 2
    ↓
┌─────────────────┐
│ API Returns 429 │
└─────────────────┘
    ↓
Wait 2 seconds
    ↓
Retry attempt 3
    ↓
┌─────────────────┐
│   Success! ✅   │
└─────────────────┘
    ↓
Return schedule to frontend
```

---

## 🎯 Benefits

### 1. **Better User Experience**
- ✅ Most rate limit errors handled automatically
- ✅ User doesn't see errors unless all retries fail
- ✅ Clear message when traffic is high

### 2. **Production Ready**
- ✅ Handles temporary API issues gracefully
- ✅ Exponential backoff prevents overwhelming the API
- ✅ Configurable retry settings
- ✅ Detailed logging for debugging

### 3. **Hackathon Value**
- ✅ Shows understanding of production concerns
- ✅ Demonstrates robust error handling
- ✅ Proves application is reliable under load
- ✅ Judges can test without worrying about rate limits

---

## 🧪 Testing

### Test 1: Simulate Rate Limit
1. Temporarily modify code to always return 429
2. Watch console for retry logs
3. Verify 3 retries with increasing delays
4. Confirm user gets friendly error message

### Test 2: Successful Retry
1. Wait for actual Cerebras rate limit
2. Click "Generate Plan"
3. Watch console: "Rate limit hit. Retrying in 1000ms..."
4. Verify plan generates successfully on retry

### Test 3: All Retries Exhausted
1. If Cerebras is down for extended period
2. Verify user sees: "Cerebras is experiencing high traffic..."
3. No generic error messages shown

---

## 📈 Monitoring & Logs

### Console Output Example:
```
Rate limit hit. Retrying in 1000ms... (Attempt 1/4)
Rate limit hit. Retrying in 2000ms... (Attempt 2/4)
Rate limit hit. Retrying in 4000ms... (Attempt 3/4)
Plan generated using llama-4-scout-17b-16e-instruct in 8245ms
```

### What to Watch:
- **Retry frequency**: If seeing many retries, Cerebras may be overloaded
- **Success rate**: Percentage of requests that succeed on retry
- **Latency**: Total time including retries (shown to user)

---

## ⚙️ Configuration Options

### Adjust for Different Needs:

#### More Aggressive (Faster, Less Patient):
```javascript
const RETRY_CONFIG = {
  maxRetries: 2,
  initialDelayMs: 500,
  maxDelayMs: 2000,
  backoffMultiplier: 2,
};
```

#### More Patient (Slower, Higher Success Rate):
```javascript
const RETRY_CONFIG = {
  maxRetries: 5,
  initialDelayMs: 2000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};
```

---

## 🎬 Demo Points

### For Hackathon Video:

**Show Reliability:**
1. "We've added intelligent retry logic"
2. "If Cerebras is busy, we automatically retry with exponential backoff"
3. Show console logs during retry
4. "This makes our app production-ready and reliable"

**Technical Sophistication:**
- "Exponential backoff prevents overwhelming the API"
- "Configurable retry settings"
- "User-friendly error messages"

---

## 🚀 Future Enhancements

### Could Add:
1. **Client-Side Retry**: Frontend also retries on 429
2. **Queue System**: Queue requests when rate limited
3. **Circuit Breaker**: Temporarily stop requests if API is down
4. **Metrics Dashboard**: Show retry rate, success rate
5. **Fallback Models**: Try different model if one is rate-limited
6. **Request Throttling**: Limit requests per minute client-side

---

## ✅ Status

**Implementation:** ✅ Complete
**Testing:** ⏳ Ready to test
**Documentation:** ✅ Complete

### Applied To:
- [x] `/generate-plan` endpoint
- [x] `/generate-suggestions` endpoint
- [x] User-friendly error messages
- [x] Console logging
- [x] Configurable settings

---

## 📝 Error Response Format

### Success:
```json
{
  "success": true,
  "aiPlan": "...",
  "metadata": {
    "model": "llama-4-scout-17b-16e-instruct",
    "latency": 8245,
    "tokensUsed": {...}
  }
}
```

### Rate Limit Error (After All Retries):
```json
{
  "success": false,
  "error": "Cerebras is experiencing high traffic. Please try again in a moment.",
  "retryable": true
}
```

### Other Error:
```json
{
  "success": false,
  "error": "Failed to generate AI plan.",
  "retryable": false
}
```

---

**This makes your hackathon project production-ready and demonstrates professional-level error handling!** 🎯

