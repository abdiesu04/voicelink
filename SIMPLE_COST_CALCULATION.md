# VoiceLink - Simple Cost Calculation Per Hour

## 📊 Basic Facts

**1 hour conversation = 2 users talking**

**Assumption:**
- Average speaking speed: 150 words per minute
- Average word length: 5 characters
- Each user speaks 50% of time = 30 minutes each

---

## 🧮 Step 1: Calculate Characters Per Hour

```
User A speaks: 30 minutes
30 minutes × 150 words/minute = 4,500 words
4,500 words × 5 characters/word = 22,500 characters

User B speaks: 30 minutes  
30 minutes × 150 words/minute = 4,500 words
4,500 words × 5 characters/word = 22,500 characters

TOTAL CHARACTERS PER HOUR = 45,000 characters
```

---

## 💰 Step 2: Azure Pricing Per Character

### Speech-to-Text (STT)
```
Price: $1.00 per audio hour
NOT charged per character - charged per audio time

1 hour of conversation = $1.00
```

### Translation
```
Price: $10.00 per 1,000,000 characters
     = $0.01 per 1,000 characters

45,000 characters ÷ 1,000 = 45 thousand characters
45 × $0.01 = $0.45 per hour
```

### Text-to-Speech (TTS) - Neural Voices
```
Price: $16.00 per 1,000,000 characters
     = $0.016 per 1,000 characters

45,000 characters ÷ 1,000 = 45 thousand characters
45 × $0.016 = $0.72 per hour
```

---

## 💰 Step 3: Amazon Polly Pricing Per Character

### Text-to-Speech - Standard Voices
```
Price: $4.00 per 1,000,000 characters
     = $0.004 per 1,000 characters

45,000 characters ÷ 1,000 = 45 thousand characters
45 × $0.004 = $0.18 per hour
```

### Text-to-Speech - Neural Voices
```
Price: $16.00 per 1,000,000 characters
     = $0.016 per 1,000 characters

45,000 characters ÷ 1,000 = 45 thousand characters
45 × $0.016 = $0.72 per hour
(Same as Azure Neural)
```

---

## 📋 Final Cost Per Hour

### Option 1: All Azure Services
```
Speech-to-Text:    $1.00
Translation:       $0.45
TTS (Neural):      $0.72
─────────────────────────
TOTAL:            $2.17 per hour
```

### Option 2: Azure + Amazon Polly Standard
```
Speech-to-Text:    $1.00
Translation:       $0.45
TTS (Polly Std):   $0.18
─────────────────────────
TOTAL:            $1.63 per hour
```

---

## 🎯 With Optimizations (Realistic Usage)

**Reality Check:**
- People don't speak continuously for 60 minutes
- Natural pauses, listening time, thinking
- Actual speaking time: ~40 minutes (not 60)
- This reduces characters to ~30,000 (not 45,000)

### Optimized Calculation:
```
40 minutes speaking ÷ 2 users = 20 minutes each
20 min × 150 words/min × 5 chars = 15,000 chars per user
Total: 30,000 characters per hour

Speech-to-Text (40 min actual audio):
40 minutes = 0.67 hours
0.67 × $1.00 = $0.67

Translation:
30,000 ÷ 1,000 = 30 thousand characters
30 × $0.01 = $0.30

TTS (Polly Standard):
30,000 ÷ 1,000 = 30 thousand characters
30 × $0.004 = $0.12

With 15% phrase caching (common words like "hello"):
Translation: $0.30 × 0.85 = $0.26
TTS: $0.12 × 0.85 = $0.10

─────────────────────────
OPTIMIZED TOTAL: $1.03 per hour
```

---

## 📊 Summary Table

| Scenario | Characters | STT | Translation | TTS | **Total** |
|----------|-----------|-----|-------------|-----|-----------|
| Worst-case (continuous) | 45,000 | $1.00 | $0.45 | $0.72 | **$2.17** |
| Worst-case (Polly Std) | 45,000 | $1.00 | $0.45 | $0.18 | **$1.63** |
| Realistic (Polly Std) | 30,000 | $0.67 | $0.30 | $0.12 | **$1.09** |
| Optimized (cache+VAD) | 30,000 | $0.67 | $0.26 | $0.10 | **$1.03** |

---

## 🔢 Cost Per Character Breakdown

### Azure Services:
```
STT:         N/A (charged per audio hour, not per character)
Translation: $0.00001 per character ($10 ÷ 1,000,000)
TTS Neural:  $0.000016 per character ($16 ÷ 1,000,000)
```

### Amazon Polly:
```
TTS Standard: $0.000004 per character ($4 ÷ 1,000,000)
TTS Neural:   $0.000016 per character ($16 ÷ 1,000,000)
```

---

## 💡 Simple Formula

**To calculate YOUR cost per hour:**

```
1. Count speaking minutes in 1 hour: _______ minutes

2. Calculate characters:
   Characters = Minutes × 150 words/min × 5 chars/word
   Characters = _______ × 150 × 5 = _______ characters

3. Calculate STT cost:
   STT = (Speaking minutes ÷ 60) × $1.00 = $_______

4. Calculate Translation cost:
   Translation = (Characters ÷ 1,000) × $0.01 = $_______

5. Calculate TTS cost:
   
   If using Azure Neural:
   TTS = (Characters ÷ 1,000) × $0.016 = $_______
   
   If using Polly Standard:
   TTS = (Characters ÷ 1,000) × $0.004 = $_______

6. Add them up:
   TOTAL = STT + Translation + TTS = $_______
```

---

## 📈 Examples for Different Speaking Times

### 20 minutes of speaking in 1 hour:
```
Characters: 20 × 150 × 5 = 15,000
STT: (20÷60) × $1.00 = $0.33
Translation: (15,000÷1,000) × $0.01 = $0.15
TTS (Polly): (15,000÷1,000) × $0.004 = $0.06
TOTAL: $0.54 per hour
```

### 40 minutes of speaking in 1 hour:
```
Characters: 40 × 150 × 5 = 30,000
STT: (40÷60) × $1.00 = $0.67
Translation: (30,000÷1,000) × $0.01 = $0.30
TTS (Polly): (30,000÷1,000) × $0.004 = $0.12
TOTAL: $1.09 per hour
```

### 60 minutes of speaking (continuous):
```
Characters: 60 × 150 × 5 = 45,000
STT: (60÷60) × $1.00 = $1.00
Translation: (45,000÷1,000) × $0.01 = $0.45
TTS (Polly): (45,000÷1,000) × $0.004 = $0.18
TOTAL: $1.63 per hour
```

---

## ✅ Bottom Line

**Most realistic cost per hour:** **$1.03**

This assumes:
- 40 minutes actual speaking (typical conversation)
- Amazon Polly Standard voices
- 15% phrase caching for common words
