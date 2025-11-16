/**
 * Comprehensive Test Suite for Azure Speech SDK Deduplication
 * 
 * Tests the two-tier deduplication system:
 * - Tier 1: Azure Rescoring Protection (98% original text similarity)
 * - Tier 2: Standard Fuzzy Matching (82% both original and translated) with numeric-delta bypass
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Text similarity function (copied from routes.ts for testing)
function textSimilarity(text1: string, text2: string): number {
  const normalize = (text: string) => 
    text.normalize('NFKC')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, '')
      .trim();

  const s1 = normalize(text1);
  const s2 = normalize(text2);

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const len1 = s1.length;
  const len2 = s2.length;
  const maxLen = Math.max(len1, len2);

  let matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  return 1 - distance / maxLen;
}

// Deduplication logic simulation
interface Message {
  originalText: string;
  translatedText: string;
  timestamp: number;
}

class DeduplicationTester {
  private recentMessages: Message[] = [];
  private readonly TIER1_THRESHOLD = 0.98; // Azure rescoring protection  
  private readonly TIER2_THRESHOLD = 0.82; // Standard fuzzy matching
  private readonly TIME_WINDOW = 2000; // 2 seconds
  private readonly MAX_RECENT = 5;

  isDuplicate(originalText: string, translatedText: string): boolean {
    const now = Date.now();
    
    // Clean up old messages outside time window
    this.recentMessages = this.recentMessages.filter(
      msg => now - msg.timestamp < this.TIME_WINDOW
    );

    // Check against recent messages
    for (const recent of this.recentMessages) {
      const originalSim = textSimilarity(originalText, recent.originalText);
      
      // TIER 1: Azure Rescoring Detection
      // Block if ORIGINAL text is ≥98% similar (even if translations differ)
      if (originalSim >= this.TIER1_THRESHOLD) {
        console.log(`[TIER 1 BLOCKED] Azure rescoring detected: ${(originalSim * 100).toFixed(1)}% similarity`);
        return true;
      }

      // TIER 2: Standard Fuzzy Matching with Numeric Bypass
      // Block if BOTH original AND translated are ≥82% similar
      const translatedSim = textSimilarity(translatedText, recent.translatedText);
      if (originalSim >= this.TIER2_THRESHOLD && translatedSim >= this.TIER2_THRESHOLD) {
        // NUMERIC-DELTA BYPASS: Allow if only numbers differ
        const extractNumbers = (txt: string): string[] => {
          return (txt.match(/\d+/g) || []);
        };
        
        const originalNumbers1 = extractNumbers(recent.originalText).join(',');
        const originalNumbers2 = extractNumbers(originalText).join(',');
        const translatedNumbers1 = extractNumbers(recent.translatedText).join(',');
        const translatedNumbers2 = extractNumbers(translatedText).join(',');
        
        const hasNumbers = (originalNumbers1 || originalNumbers2) && (translatedNumbers1 || translatedNumbers2);
        const numbersDiffer = originalNumbers1 !== originalNumbers2 || translatedNumbers1 !== translatedNumbers2;
        
        if (hasNumbers && numbersDiffer) {
          console.log(`[TIER 2 BYPASSED] Numbers differ - allowing: orig="${originalNumbers1}"→"${originalNumbers2}", trans="${translatedNumbers1}"→"${translatedNumbers2}"`);
          // Don't return true - allow this message
        } else {
          console.log(`[TIER 2 BLOCKED] Standard duplicate: orig=${(originalSim * 100).toFixed(1)}%, trans=${(translatedSim * 100).toFixed(1)}%`);
          return true;
        }
      }
    }

    // Not a duplicate - add to recent messages
    this.recentMessages.push({ originalText, translatedText, timestamp: now });
    
    // Keep only last N messages
    if (this.recentMessages.length > this.MAX_RECENT) {
      this.recentMessages.shift();
    }

    return false;
  }

  reset() {
    this.recentMessages = [];
  }
}

describe('Azure Speech SDK Deduplication Tests', () => {
  let dedup: DeduplicationTester;

  beforeEach(() => {
    dedup = new DeduplicationTester();
  });

  describe('TIER 1: Azure Rescoring Protection (98% Original Text)', () => {
    
    it('should block identical Bengali text with different translations (real Azure rescoring)', () => {
      const original = "১৬ জন নিহত হয়েছে";
      const translation1 = "16 people killed";
      const translation2 = "41016 people killed"; // Azure mishears numbers

      expect(dedup.isDuplicate(original, translation1)).toBe(false); // First message
      expect(dedup.isDuplicate(original, translation2)).toBe(true);  // Blocked - same original
    });

    it('should block English text with minor variations (98% similar)', () => {
      const original1 = "The meeting starts at 3 PM today";
      const original2 = "The meeting starts at 3PM today"; // Space difference
      const translation = "La réunion commence à 15h aujourd'hui";

      expect(dedup.isDuplicate(original1, translation)).toBe(false);
      expect(dedup.isDuplicate(original2, translation)).toBe(true); // Blocked
    });

    it('should block Arabic text with punctuation differences', () => {
      const original1 = "مرحبا بك في الخدمة";
      const original2 = "مرحبا بك في الخدمة!"; // Added exclamation
      const translation1 = "Welcome to the service";
      const translation2 = "Welcome to service"; // Slightly different

      expect(dedup.isDuplicate(original1, translation1)).toBe(false);
      expect(dedup.isDuplicate(original2, translation2)).toBe(true); // Blocked - original >95%
    });

    it('should block Japanese text with minor character variations', () => {
      const original1 = "今日は良い天気ですね";
      const original2 = "今日は良い天気ですね。"; // Added period
      const translation1 = "Nice weather today";
      const translation2 = "The weather is nice today"; // Different translation

      expect(dedup.isDuplicate(original1, translation1)).toBe(false);
      expect(dedup.isDuplicate(original2, translation2)).toBe(true); // Blocked
    });

    it('should block Chinese text rescoring scenario', () => {
      const original = "我们需要更多时间";
      const translation1 = "We need more time";
      const translation2 = "We require additional time"; // Azure provides alternative

      expect(dedup.isDuplicate(original, translation1)).toBe(false);
      expect(dedup.isDuplicate(original, translation2)).toBe(true); // Blocked
    });

    it('should block Spanish number mishearing (common Azure issue)', () => {
      const original = "Cincuenta personas";
      const translation1 = "Fifty people";
      const translation2 = "15 people"; // Mishears "cincuenta" as "quince"

      expect(dedup.isDuplicate(original, translation1)).toBe(false);
      expect(dedup.isDuplicate(original, translation2)).toBe(true); // Blocked
    });
  });

  describe('TIER 2: Standard Fuzzy Matching (82% Both Texts)', () => {
    
    it('should block minor transcription variations in both texts', () => {
      const original1 = "Hello everyone how are you";
      const original2 = "Hello everyone how are u"; // "you" vs "u"
      const translation1 = "Hola a todos como estan";
      const translation2 = "Hola a todos como están"; // Minor accent difference

      expect(dedup.isDuplicate(original1, translation1)).toBe(false);
      expect(dedup.isDuplicate(original2, translation2)).toBe(true); // Both >82%
    });

    it('should block duplicate German messages with minor typos', () => {
      const original1 = "Guten Morgen zusammen";
      const original2 = "Guten Morgen zusamenn"; // Typo
      const translation1 = "Good morning everyone";
      const translation2 = "Good morning everone"; // Typo

      expect(dedup.isDuplicate(original1, translation1)).toBe(false);
      expect(dedup.isDuplicate(original2, translation2)).toBe(true);
    });

    it('should block French duplicates with case differences', () => {
      const original1 = "BONJOUR TOUT LE MONDE";
      const original2 = "bonjour tout le monde"; // Case change
      const translation1 = "HELLO EVERYONE";
      const translation2 = "hello everyone"; // Case change

      expect(dedup.isDuplicate(original1, translation1)).toBe(false);
      expect(dedup.isDuplicate(original2, translation2)).toBe(true);
    });
  });

  describe('TIER 2: Numeric-Delta Bypass', () => {
    
    it('should ALLOW time corrections where only numbers differ', () => {
      const original1 = "The meeting starts at 3 PM today";
      const original2 = "The meeting starts at 5 PM today";
      const translation1 = "La réunion commence à 3 PM aujourd'hui";
      const translation2 = "La réunion commence à 5 PM aujourd'hui";

      expect(dedup.isDuplicate(original1, translation1)).toBe(false);
      expect(dedup.isDuplicate(original2, translation2)).toBe(false); // ALLOWED - numbers differ (3→5)
    });

    it('should ALLOW quantity corrections where only numbers differ', () => {
      const original1 = "I need 10 minutes";
      const original2 = "I need 50 minutes";
      const translation1 = "Necesito 10 minutos";
      const translation2 = "Necesito 50 minutos";

      expect(dedup.isDuplicate(original1, translation1)).toBe(false);
      expect(dedup.isDuplicate(original2, translation2)).toBe(false); // ALLOWED - numbers differ (10→50)
    });

    it('should BLOCK duplicates with no numbers present', () => {
      const original1 = "Hello everyone how are you";
      const original2 = "Hello everyone how are u";
      const translation1 = "Hola a todos como están";
      const translation2 = "Hola a todos como estan";

      expect(dedup.isDuplicate(original1, translation1)).toBe(false);
      expect(dedup.isDuplicate(original2, translation2)).toBe(true); // BLOCKED - no numbers, >82% similar
    });

    it('should BLOCK duplicates where numbers are identical', () => {
      const original1 = "The meeting is at 3 PM";
      const original2 = "The meeting is at 3 PM";
      const translation1 = "La reunión es a las 3 PM";
      const translation2 = "La reunión es a las 15 horas";

      expect(dedup.isDuplicate(original1, translation1)).toBe(false);
      expect(dedup.isDuplicate(original2, translation2)).toBe(true); // BLOCKED - same original (Tier 1)
    });
  });

  describe('Language-Agnostic Unicode Handling', () => {
    
    it('should handle Arabic (RTL script)', () => {
      const original = "مساء الخير";
      const translation = "Good evening";

      expect(dedup.isDuplicate(original, translation)).toBe(false);
      expect(dedup.isDuplicate(original, translation)).toBe(true); // Exact duplicate
    });

    it('should handle Russian (Cyrillic)', () => {
      const original = "Привет как дела";
      const translation = "Hello how are you";

      expect(dedup.isDuplicate(original, translation)).toBe(false);
      expect(dedup.isDuplicate(original, translation)).toBe(true);
    });

    it('should handle Korean (Hangul)', () => {
      const original = "안녕하세요 여러분";
      const translation = "Hello everyone";

      expect(dedup.isDuplicate(original, translation)).toBe(false);
      expect(dedup.isDuplicate(original, translation)).toBe(true);
    });

    it('should handle Hindi (Devanagari)', () => {
      const original = "नमस्ते आप कैसे हैं";
      const translation = "Hello how are you";

      expect(dedup.isDuplicate(original, translation)).toBe(false);
      expect(dedup.isDuplicate(original, translation)).toBe(true);
    });

    it('should handle Thai', () => {
      const original = "สวัสดีตอนเช้า";
      const translation = "Good morning";

      expect(dedup.isDuplicate(original, translation)).toBe(false);
      expect(dedup.isDuplicate(original, translation)).toBe(true);
    });

    it('should handle Vietnamese (with diacritics)', () => {
      const original = "Xin chào mọi người";
      const translation = "Hello everyone";

      expect(dedup.isDuplicate(original, translation)).toBe(false);
      expect(dedup.isDuplicate(original, translation)).toBe(true);
    });

    it('should handle Turkish (special characters)', () => {
      const original = "İyi günler nasılsınız";
      const translation = "Good day how are you";

      expect(dedup.isDuplicate(original, translation)).toBe(false);
      expect(dedup.isDuplicate(original, translation)).toBe(true);
    });

    it('should handle Portuguese (accents)', () => {
      const original = "Olá tudo bem com você";
      const translation = "Hello how are you";

      expect(dedup.isDuplicate(original, translation)).toBe(false);
      expect(dedup.isDuplicate(original, translation)).toBe(true);
    });
  });

  describe('Edge Cases: Should NOT Block', () => {
    
    it('should allow different messages in rapid succession', () => {
      expect(dedup.isDuplicate("Hello world", "Hola mundo")).toBe(false);
      expect(dedup.isDuplicate("Good morning", "Buenos días")).toBe(false);
      expect(dedup.isDuplicate("Thank you", "Gracias")).toBe(false);
    });

    it('should allow similar but distinct messages', () => {
      expect(dedup.isDuplicate("I need help with my computer", "I need assistance with my laptop")).toBe(false);
      expect(dedup.isDuplicate("The meeting is at 3 PM", "The meeting is at 5 PM")).toBe(false);
    });

    it('should allow messages with common words but different context', () => {
      expect(dedup.isDuplicate("Can you help me", "Puedes ayudarme")).toBe(false);
      expect(dedup.isDuplicate("I can help you", "Puedo ayudarte")).toBe(false); // Different despite similar words
    });

    it('should allow completely different languages with unrelated content', () => {
      expect(dedup.isDuplicate("天气很好", "The weather is nice")).toBe(false);
      expect(dedup.isDuplicate("今日は会議があります", "Today there is a meeting")).toBe(false);
      expect(dedup.isDuplicate("مرحبا", "Goodbye")).toBe(false); // Different meaning
    });

    it('should not block low similarity messages (< 82%)', () => {
      const original1 = "The quick brown fox";
      const original2 = "A lazy dog sleeps"; // Completely different
      const translation1 = "El zorro marrón rápido";
      const translation2 = "Un perro perezoso duerme";

      expect(dedup.isDuplicate(original1, translation1)).toBe(false);
      expect(dedup.isDuplicate(original2, translation2)).toBe(false); // Should NOT block
    });
  });

  describe('Time Window Behavior', () => {
    
    it('should allow duplicates after time window expires', async () => {
      const original = "Hello world";
      const translation = "Hola mundo";

      expect(dedup.isDuplicate(original, translation)).toBe(false);
      expect(dedup.isDuplicate(original, translation)).toBe(true); // Blocked within window

      // Simulate 2.5 seconds passing (outside 2-second window)
      await new Promise(resolve => setTimeout(resolve, 2500));

      expect(dedup.isDuplicate(original, translation)).toBe(false); // Allowed - outside window
    });
  });

  describe('Real-World Azure Rescoring Scenarios', () => {
    
    it('should handle number mishearing across languages', () => {
      // English
      expect(dedup.isDuplicate("Fifteen people", "15 people")).toBe(false);
      expect(dedup.isDuplicate("Fifteen people", "50 people")).toBe(true); // Rescoring

      dedup.reset();

      // Spanish
      expect(dedup.isDuplicate("Quince personas", "Fifteen people")).toBe(false);
      expect(dedup.isDuplicate("Quince personas", "Fifty people")).toBe(true);

      dedup.reset();

      // Arabic
      expect(dedup.isDuplicate("خمسة عشر شخصا", "Fifteen people")).toBe(false);
      expect(dedup.isDuplicate("خمسة عشر شخصا", "Fifty people")).toBe(true);
    });

    it('should handle proper noun variations', () => {
      // Azure might transcribe names differently
      expect(dedup.isDuplicate("My name is Mohammed", "Me llamo Mohammed")).toBe(false);
      expect(dedup.isDuplicate("My name is Mohammed", "Me llamo Muhammad")).toBe(true); // Variant spelling
    });

    it('should handle compound word rescoring', () => {
      // German compound words
      expect(dedup.isDuplicate("Krankenhaus", "Hospital")).toBe(false);
      expect(dedup.isDuplicate("Krankenhaus", "Sick house")).toBe(true); // Literal rescoring
    });
  });

  describe('Text Similarity Function Tests', () => {
    
    it('should return 1.0 for identical texts', () => {
      expect(textSimilarity("Hello", "Hello")).toBe(1.0);
      expect(textSimilarity("مرحبا", "مرحبا")).toBe(1.0);
    });

    it('should handle Unicode normalization', () => {
      const text1 = "café"; // é as single character
      const text2 = "café"; // e + combining accent
      expect(textSimilarity(text1, text2)).toBeGreaterThan(0.95);
    });

    it('should ignore case', () => {
      expect(textSimilarity("HELLO", "hello")).toBe(1.0);
    });

    it('should ignore punctuation', () => {
      expect(textSimilarity("Hello!", "Hello")).toBe(1.0);
      expect(textSimilarity("What?", "What")).toBe(1.0);
    });

    it('should handle empty strings', () => {
      expect(textSimilarity("", "")).toBe(0.0);
      expect(textSimilarity("Hello", "")).toBe(0.0);
    });

    it('should calculate correct similarity for similar texts', () => {
      const sim = textSimilarity("Hello world", "Hello word"); // One char diff
      expect(sim).toBeGreaterThan(0.90);
      expect(sim).toBeLessThan(1.0);
    });
  });
});

// Export for manual testing
export { DeduplicationTester, textSimilarity };
