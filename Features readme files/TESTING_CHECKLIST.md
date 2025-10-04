# Model Selection Feature - Testing Checklist

## 🧪 Test Steps

### Test 1: Index Page - Model Banner Display
**What to check:**
1. Open `http://localhost:5050/` (or your server port)
2. Look for a **purple gradient banner** above "Structured Schedule"
3. Banner should show:
   - 🤖 AI Model: Llama 4 Scout 17B (default)
   - Speed and Quality ratings (⚡ Very Fast | ⭐⭐⭐ Good)
   - "Change Model ⚙️" button on the right

**Expected Result:** ✅ Banner visible with model info

---

### Test 2: Generate a Plan
**What to do:**
1. Enter a daily plan (e.g., "Tomorrow I have a meeting at 10am, lunch at 12pm, and gym at 5pm")
2. Click "Generate Plan"
3. Wait for the schedule to generate

**What to check:**
- Banner updates to show: "Llama 4 Scout 17B (Just used - XXms)"
- Latency in milliseconds appears (should be very fast, under 2000ms)
- Schedule displays correctly in table format

**Expected Result:** ✅ Plan generated with latency displayed

---

### Test 3: Navigate to Settings
**What to do:**
1. Click the **"Change Model ⚙️"** button on the banner
2. Should redirect to Settings page

**What to check:**
- Redirected to `/settings.html`
- Page loads without errors

**Expected Result:** ✅ Successfully navigated to Settings

---

### Test 4: Settings - Model Selection Dropdown
**What to check in Settings page:**
1. Scroll to **"AI Model Settings"** section (should be near the top)
2. Find the dropdown labeled "AI Model"
3. Click the dropdown

**Dropdown should contain 5 models:**
- ✅ Llama 4 Scout 17B (currently selected)
- ✅ Llama 3.1 8B
- ✅ Llama 3.3 70B
- ✅ Llama 3.1 70B
- ✅ Llama 3.3 70B Instruct

**Expected Result:** ✅ All 5 models visible in dropdown

---

### Test 5: Model Information Display
**What to check:**
Below the dropdown, there should be a **light blue/gray box** showing:
- Speed: ⚡ Very Fast
- Quality: ⭐⭐⭐ Good
- Tokens/sec: ~800
- Best for: Quick plans, simple scheduling, real-time responses
- Description: "Ultra-fast model optimized for quick responses"

**Expected Result:** ✅ Model info displayed correctly

---

### Test 6: Last Generation Metrics
**What to check:**
Below model info, there should be a **gray box** labeled "Last Generation Metrics" showing:
- Latency: XXms (from your previous generation)
- Tokens Used: {...} (JSON object with token counts)
- Model: llama-4-scout-17b-16e-instruct

**Expected Result:** ✅ Metrics from previous generation displayed

---

### Test 7: Change to a Different Model
**What to do:**
1. In the dropdown, select **"Llama 3.1 8B"**
2. Alert should appear confirming the change

**What to check in alert:**
- "Model switched to Llama 3.1 8B!"
- Speed: ⚡⚡ Fast
- Quality: ⭐⭐⭐⭐ Very Good

**What to check after closing alert:**
- Model info box updates to show Llama 3.1 8B details
- Speed changes to "⚡⚡ Fast"
- Quality changes to "⭐⭐⭐⭐ Very Good"
- Best for: "General purpose, balanced performance, daily planning"

**Expected Result:** ✅ Model changed successfully

---

### Test 8: Generate Plan with New Model
**What to do:**
1. Go back to index page (`http://localhost:5050/`)
2. Banner should now show: "Llama 3.1 8B"
3. Enter another daily plan
4. Click "Generate Plan"

**What to check:**
- Banner updates with new latency
- Plan generates successfully
- Model name shows "Llama 3.1 8B (Just used - XXms)"

**Expected Result:** ✅ New model used for generation

---

### Test 9: Compare Model Performance
**What to do:**
1. Go to Settings
2. Try selecting **"Llama 3.3 70B"** (larger, slower model)
3. Return to index page
4. Generate a plan with complex requirements
5. Note the latency difference

**What to check:**
- Larger model may take slightly longer (200-500ms more)
- Quality of output may be more detailed
- Metrics in Settings update with new latency

**Expected Result:** ✅ Performance difference observable

---

### Test 10: API Endpoints Direct Test
**Open browser console (F12) and test APIs:**

```javascript
// Test 1: Get available models
fetch('/api/models')
  .then(r => r.json())
  .then(d => console.log('Models:', d));

// Test 2: Change model
fetch('/api/models/set', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({modelId: 'llama3.3-70b'})
})
  .then(r => r.json())
  .then(d => console.log('Changed:', d));
```

**Expected Result:** ✅ Both API calls return success

---

## 🐛 Common Issues & Fixes

### Issue 1: Banner Not Showing
**Symptom:** No purple banner on index page
**Fix:** 
- Check browser console for errors
- Ensure server is running
- Hard refresh page (Ctrl+Shift+R)

### Issue 2: Models Not Loading
**Symptom:** Dropdown shows "Loading models..." or "Error loading models"
**Fix:**
- Check server console for errors
- Verify `/api/models` endpoint is working
- Check network tab in browser DevTools

### Issue 3: Model Change Not Working
**Symptom:** Alert doesn't appear or model doesn't change
**Fix:**
- Check server console for errors
- Verify `/api/models/set` endpoint is working
- Check browser console for JavaScript errors

### Issue 4: Metrics Not Displaying
**Symptom:** "Last Generation Metrics" box doesn't appear
**Fix:**
- Generate at least one plan first
- Check localStorage in DevTools (Application tab)
- Look for `lastGenMetrics` key

---

## ✅ Success Criteria

All tests pass if:
- [ ] Banner displays on index page
- [ ] Current model name and ratings visible
- [ ] "Change Model" button works
- [ ] Settings page shows all 5 models
- [ ] Model info updates when selection changes
- [ ] Plan generation uses selected model
- [ ] Latency metrics display correctly
- [ ] Model switching persists across page loads
- [ ] API endpoints respond correctly

---

## 📊 Performance Comparison Table

After testing, fill this in:

| Model | Latency (ms) | Quality Observation | Use Case |
|-------|--------------|---------------------|----------|
| Llama 4 Scout 17B | ___ | ___ | Quick responses |
| Llama 3.1 8B | ___ | ___ | Balanced |
| Llama 3.3 70B | ___ | ___ | Detailed plans |
| Llama 3.1 70B | ___ | ___ | Complex scheduling |
| Llama 3.3 70B Instruct | ___ | ___ | Structured output |

---

## 📹 Demo Video Key Moments

1. **0:10** - Show model banner on index page
2. **0:20** - Generate plan, highlight latency
3. **0:30** - Click "Change Model" button
4. **0:40** - Show all 5 models in dropdown
5. **0:50** - Select different model, show info update
6. **1:00** - Generate with new model, compare latency
7. **1:10** - Show metrics in Settings page
8. **1:20** - Explain speed vs quality tradeoff

---

**Ready to test? Start with Test 1!**

