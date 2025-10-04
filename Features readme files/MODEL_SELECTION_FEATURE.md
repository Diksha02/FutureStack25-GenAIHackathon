# AI Model Selection Feature

## Overview
Added comprehensive AI model selection functionality to demonstrate **best use of Cerebras API** for the hackathon.

## Features Implemented

### 1. Multiple Cerebras Models Available
The application now supports 5 different Cerebras Llama models:

| Model | Speed | Quality | Best For |
|-------|-------|---------|----------|
| **Llama 4 Scout 17B** | ⚡ Very Fast (~800 tokens/sec) | ⭐⭐⭐ Good | Quick plans, simple scheduling |
| **Llama 3.1 8B** | ⚡⚡ Fast (~500 tokens/sec) | ⭐⭐⭐⭐ Very Good | General purpose, daily planning |
| **Llama 3.3 70B** | ⚡⚡ Moderate (~200 tokens/sec) | ⭐⭐⭐⭐⭐ Excellent | Complex plans, multi-step reasoning |
| **Llama 3.1 70B** | ⚡⚡ Moderate (~200 tokens/sec) | ⭐⭐⭐⭐⭐ Excellent | Detailed schedules |
| **Llama 3.3 70B Instruct** | ⚡⚡ Moderate (~200 tokens/sec) | ⭐⭐⭐⭐⭐ Excellent | Structured output, complex tasks |

### 2. Model Selection in Settings Page
- **Location**: Settings → AI Model Settings section
- **Features**:
  - Dropdown to select from all available models
  - Live model information display showing:
    - Speed rating
    - Quality rating
    - Tokens per second
    - Best use cases
    - Detailed description
  - Last Generation Metrics panel showing:
    - Latency (milliseconds)
    - Tokens used
    - Model used for generation

### 3. Model Banner on Index Page
- **Location**: Index page (main plan generation page)
- **Features**:
  - Always-visible banner showing current selected model
  - Displays model name and quality/speed ratings
  - "Change Model" button that redirects to Settings
  - Updates after plan generation to show latency

### 4. Backend API Endpoints

#### GET /api/models
Returns available models and current selection:
```json
{
  "success": true,
  "models": [...],
  "currentModel": "llama-4-scout-17b-16e-instruct"
}
```

#### POST /api/models/set
Set the active model:
```json
{
  "modelId": "llama3.3-70b"
}
```

### 5. Performance Metrics Tracking
- Latency measurement for each generation
- Token usage tracking
- Metrics stored in localStorage
- Displayed in Settings page for comparison

## User Flow

1. **Initial Load**: User sees default model (Llama 4 Scout 17B - fastest)
2. **View Current Model**: Banner on index page shows active model
3. **Generate Plan**: Plan generated using selected model, latency displayed
4. **Change Model**: Click "Change Model" → redirected to Settings
5. **Select New Model**: Choose from dropdown, see quality/speed tradeoff
6. **Generate Again**: New plan uses updated model, metrics compared

## Hackathon Demonstration Points

### Cerebras API - Best Use
✅ **Multiple Model Support**: Showcases Cerebras's diverse model portfolio
✅ **Performance Metrics**: Demonstrates Cerebras's speed advantage
✅ **Quality vs Speed Tradeoff**: Shows intelligent model selection
✅ **Real-time Switching**: Instant model updates without restart
✅ **Latency Tracking**: Highlights Cerebras's fast inference

### Key Talking Points for Demo Video
1. "We leverage Cerebras's full model portfolio - from ultra-fast Scout 17B to high-quality 70B models"
2. "Users can choose speed vs quality based on their needs - quick plans or detailed analysis"
3. "Real-time metrics show Cerebras's incredible performance - sub-second responses"
4. "Seamless model switching without restarting the application"
5. "Smart defaults: fastest model for real-time, largest for complex planning"

## Technical Implementation

### Frontend (`pages/index.html`)
- Model banner with live updates
- Automatic model info loading on page load
- Post-generation latency display

### Frontend (`pages/settings.html`)
- Model selection dropdown
- Model information cards
- Metrics display panel
- Change handling with confirmation

### Backend (`server/src/index.js`)
- Model metadata configuration
- API endpoints for model management
- Dynamic model switching
- Metadata tracking in responses

## Testing Checklist
- [ ] Load index page - banner shows default model
- [ ] Generate plan - latency appears in banner
- [ ] Click "Change Model" - redirects to settings
- [ ] Select different model - confirmation appears
- [ ] Generate new plan - uses new model
- [ ] Check Settings - metrics show last generation
- [ ] Compare different models - observe speed/quality differences

## Future Enhancements
- Model auto-selection based on plan complexity
- Historical performance comparison charts
- A/B testing between models
- Cost tracking (if applicable)
- Retry with different model on failure

