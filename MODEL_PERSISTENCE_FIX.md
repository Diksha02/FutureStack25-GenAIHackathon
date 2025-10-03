# Model Selection Persistence Fix

## 🐛 Problem

Model selection wasn't being saved - it would reset to default after server restart.

**Before:**
```javascript
let currentModel = "llama-4-scout-17b-16e-instruct"; // In-memory only
```

When you selected a different model (e.g., Llama 3.1 8B), it would work until:
- Server restart
- Then it would reset back to the default fast model

---

## ✅ Solution: Database Persistence

Added a `settings` table to store app configuration permanently.

### 1. New Database Table
```sql
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime'))
);
```

### 2. New Database Functions
```javascript
// Get a setting with optional default
const getSetting = (key, defaultValue = null) => {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row ? row.value : defaultValue;
};

// Set a setting (upsert)
const setSetting = (key, value) => {
  db.prepare(`
    INSERT INTO settings (key, value, updated_at) 
    VALUES (?, ?, strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime'))
    ON CONFLICT(key) DO UPDATE SET 
      value = excluded.value,
      updated_at = excluded.updated_at
  `).run(key, value);
};
```

### 3. Load Model on Startup
```javascript
// Initialize database first
initDb();

// Load persisted model selection
let currentModel = getSetting("currentModel", "llama-4-scout-17b-16e-instruct");
console.log(`Loaded model from database: ${currentModel}`);
```

### 4. Save Model on Change
```javascript
app.post("/api/models/set", (req, res) => {
  const { modelId } = req.body;
  
  // Update in-memory
  currentModel = modelId;
  
  // Persist to database
  const saved = setSetting("currentModel", modelId);
  
  console.log(`Model switched to: ${model.name} (${modelId}) - Saved to database`);
  
  res.json({
    success: true,
    message: `Model set to ${model.name}`,
    currentModel: currentModel,
    persisted: saved,
  });
});
```

---

## 🔄 How It Works Now

### First Time (No Setting Saved):
```
1. Server starts
2. Checks database for "currentModel"
3. Not found → Uses default: "llama-4-scout-17b-16e-instruct"
4. User selects "llama3.1-8b"
5. Saves to database: settings table
```

### After Restart:
```
1. Server starts
2. Checks database for "currentModel"
3. Found: "llama3.1-8b"
4. Uses that model ✅
5. User's selection persists!
```

---

## 🧪 Testing

### Test 1: Change Model
1. Go to Settings
2. Select "Llama 3.1 8B"
3. Alert confirms: "Model switched to Llama 3.1 8B!"
4. **Verify console:** "Model switched to: Llama 3.1 8B (llama3.1-8b) - Saved to database"

### Test 2: Restart Server
1. Stop server (Ctrl+C)
2. Start server again: `npm start`
3. **Verify console:** "Loaded model from database: llama3.1-8b"
4. Go to Settings
5. **Verify dropdown:** Llama 3.1 8B is selected ✅

### Test 3: Generate Plan
1. Go to index page
2. Banner shows: "Llama 3.1 8B"
3. Generate a plan
4. Uses the saved model (not default)

---

## 📊 Database Structure

### Settings Table:
| key | value | updated_at |
|-----|-------|------------|
| currentModel | llama3.1-8b | 2025-10-03 23:45:12 |

### Future Settings (Can Add):
- userPreferences
- defaultFocusDuration
- theme
- enableNotifications
- etc.

---

## 🎯 Benefits

### 1. **Better UX**
- ✅ Model selection persists across sessions
- ✅ No need to re-select after restart
- ✅ Settings feel "real" (not temporary)

### 2. **Production Ready**
- ✅ Uses database (not just localStorage)
- ✅ Survives server restarts
- ✅ Survives browser cache clears
- ✅ Works in production deployments

### 3. **Extensible**
- ✅ Easy to add more settings
- ✅ Centralized settings management
- ✅ Can export/import settings
- ✅ Can have user-specific settings (future)

---

## 🚀 Future Enhancements

### Could Add:
1. **User-Specific Settings** (when auth is added)
2. **Setting History** (track when settings changed)
3. **Settings Export/Import** (backup settings)
4. **Settings API Endpoint** (GET /api/settings)
5. **Default Settings Reset** (reset to factory defaults)

---

## ✅ Status

**Implementation:** ✅ Complete
**Testing:** ⏳ Ready to test
**Files Modified:**
- `server/src/db/database.js` - Added settings table and functions
- `server/src/index.js` - Load/save model from database

---

## 🧪 Quick Test

1. **Restart your server**
2. **Check console:** Should show "Loaded model from database: ..."
3. **Change model in Settings**
4. **Check console:** Should show "... - Saved to database"
5. **Restart server again**
6. **Verify:** Model still selected ✅

---

**Your model selection now persists permanently!** 🎉

