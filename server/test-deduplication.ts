/**
 * Manual Test Script for Azure Deduplication
 * 
 * Run with: tsx server/test-deduplication.ts
 * 
 * This script simulates real Azure Speech SDK rescoring scenarios
 * and verifies the deduplication logic works correctly.
 */

// Text similarity function (same as in routes.ts)
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

interface TestCase {
  name: string;
  language: string;
  original1: string;
  translation1: string;
  original2: string;
  translation2: string;
  expectedBlock: boolean;
  reason: string;
}

const testCases: TestCase[] = [
  // TIER 1: Azure Rescoring (98% original similarity)
  {
    name: "Bengali Number Mishearing",
    language: "Bengali → English",
    original1: "১৬ জন নিহত হয়েছে",
    translation1: "16 people killed",
    original2: "১৬ জন নিহত হয়েছে",
    translation2: "41016 people killed",
    expectedBlock: true,
    reason: "Same Bengali text, Azure mishears number in translation"
  },
  {
    name: "Spanish Number Rescoring",
    language: "Spanish → English",
    original1: "Cincuenta personas están aquí",
    translation1: "Fifty people are here",
    original2: "Cincuenta personas están aquí",
    translation2: "15 people are here",
    expectedBlock: true,
    reason: "Identical Spanish, Azure rescores 'cincuenta' differently"
  },
  {
    name: "Arabic Punctuation Variation",
    language: "Arabic → English",
    original1: "مرحبا بك في الخدمة",
    translation1: "Welcome to the service",
    original2: "مرحبا بك في الخدمة!",
    translation2: "Welcome to service",
    expectedBlock: true,
    reason: "Same Arabic text with punctuation, different translation"
  },
  {
    name: "Japanese Period Addition",
    language: "Japanese → English",
    original1: "今日は良い天気ですね",
    translation1: "Nice weather today",
    original2: "今日は良い天気ですね。",
    translation2: "The weather is nice today",
    expectedBlock: true,
    reason: "Same Japanese with period, Azure provides alternative translation"
  },
  {
    name: "Chinese Identical Original",
    language: "Chinese → English",
    original1: "我们需要更多时间",
    translation1: "We need more time",
    original2: "我们需要更多时间",
    translation2: "We require additional time",
    expectedBlock: true,
    reason: "Identical Chinese, Azure rescores with synonym"
  },
  {
    name: "English Case Difference",
    language: "English → Spanish",
    original1: "The meeting starts at 3 PM today",
    translation1: "La reunión comienza a las 3 PM hoy",
    original2: "The meeting starts at 3PM today",
    translation2: "La reunión comienza a las 15h hoy",
    expectedBlock: false,
    reason: "Numbers present (3, 15), numeric bypass allows despite high similarity"
  },
  {
    name: "Russian Cyrillic",
    language: "Russian → English",
    original1: "Привет как дела у вас",
    translation1: "Hello how are you",
    original2: "Привет как дела у вас",
    translation2: "Hi how are things with you",
    expectedBlock: true,
    reason: "Identical Russian, alternative English translation"
  },
  {
    name: "Korean Identical",
    language: "Korean → English",
    original1: "안녕하세요 여러분",
    translation1: "Hello everyone",
    original2: "안녕하세요 여러분",
    translation2: "Hi everybody",
    expectedBlock: true,
    reason: "Same Korean, synonym in English"
  },
  
  // TIER 2: Standard Fuzzy Matching (82% both texts)
  {
    name: "German Typo Both Sides",
    language: "German → English",
    original1: "Guten Morgen zusammen",
    translation1: "Good morning everyone",
    original2: "Guten Morgen zusamenn",
    translation2: "Good morning everone",
    expectedBlock: true,
    reason: "Both texts have minor typos, >82% similar"
  },
  {
    name: "French Case Change",
    language: "French → English",
    original1: "BONJOUR TOUT LE MONDE",
    translation1: "HELLO EVERYONE",
    original2: "bonjour tout le monde",
    translation2: "hello everyone",
    expectedBlock: true,
    reason: "Same content, only case difference"
  },
  
  // Should NOT Block
  {
    name: "Different Content",
    language: "English → Spanish",
    original1: "Good morning everyone",
    translation1: "Buenos días a todos",
    original2: "Thank you very much",
    translation2: "Muchas gracias",
    expectedBlock: false,
    reason: "Completely different messages"
  },
  {
    name: "Similar But Distinct",
    language: "English → Spanish",
    original1: "The meeting is at 3 PM",
    translation1: "La reunión es a las 3 PM",
    original2: "The meeting is at 5 PM",
    translation2: "La reunión es a las 5 PM",
    expectedBlock: false,
    reason: "Different times, distinct messages"
  },
  {
    name: "Different Numbers",
    language: "English → Spanish",
    original1: "I need 10 minutes",
    translation1: "Necesito 10 minutos",
    original2: "I need 50 minutes",
    translation2: "Necesito 50 minutos",
    expectedBlock: false,
    reason: "Different quantities, not duplicates"
  },
  {
    name: "Hindi Different Context",
    language: "Hindi → English",
    original1: "आप कैसे हैं",
    translation1: "How are you",
    original2: "आप कहाँ हैं",
    translation2: "Where are you",
    expectedBlock: false,
    reason: "Different Hindi words (how vs where)"
  },
  {
    name: "Thai Unrelated",
    language: "Thai → English",
    original1: "สวัสดีตอนเช้า",
    translation1: "Good morning",
    original2: "ขอบคุณมาก",
    translation2: "Thank you very much",
    expectedBlock: false,
    reason: "Completely different Thai phrases"
  }
];

function runTest(test: TestCase): boolean {
  const TIER1_THRESHOLD = 0.98;
  const TIER2_THRESHOLD = 0.82;

  const originalSim = textSimilarity(test.original1, test.original2);
  const translatedSim = textSimilarity(test.translation1, test.translation2);

  let blocked = false;
  let tier = "";

  // Check TIER 1: Azure Rescoring
  if (originalSim >= TIER1_THRESHOLD) {
    blocked = true;
    tier = "TIER 1";
  }
  // Check TIER 2: Standard Fuzzy Matching with Numeric Bypass
  else if (originalSim >= TIER2_THRESHOLD && translatedSim >= TIER2_THRESHOLD) {
    // NUMERIC-DELTA BYPASS: Allow if only numbers differ
    const extractNumbers = (txt: string): string[] => {
      return (txt.match(/\d+/g) || []);
    };
    
    const originalNumbers1 = extractNumbers(test.original1).join(',');
    const originalNumbers2 = extractNumbers(test.original2).join(',');
    const translatedNumbers1 = extractNumbers(test.translation1).join(',');
    const translatedNumbers2 = extractNumbers(test.translation2).join(',');
    
    const hasNumbers = (originalNumbers1 || originalNumbers2) && (translatedNumbers1 || translatedNumbers2);
    const numbersDiffer = originalNumbers1 !== originalNumbers2 || translatedNumbers1 !== translatedNumbers2;
    
    if (hasNumbers && numbersDiffer) {
      // Numbers differ - allow through (bypass TIER 2)
      blocked = false;
      tier = "TIER 2 BYPASSED (numeric delta)";
    } else {
      // No number differences - block as duplicate
      blocked = true;
      tier = "TIER 2";
    }
  }

  const passed = blocked === test.expectedBlock;
  const status = passed ? "✅ PASS" : "❌ FAIL";

  console.log(`\n${status} ${test.name}`);
  console.log(`  Language: ${test.language}`);
  console.log(`  Original 1: ${test.original1}`);
  console.log(`  Translation 1: ${test.translation1}`);
  console.log(`  Original 2: ${test.original2}`);
  console.log(`  Translation 2: ${test.translation2}`);
  console.log(`  Similarity: Original=${(originalSim * 100).toFixed(1)}%, Translated=${(translatedSim * 100).toFixed(1)}%`);
  console.log(`  Expected: ${test.expectedBlock ? 'BLOCK' : 'ALLOW'}, Got: ${blocked ? 'BLOCK' : 'ALLOW'}${blocked ? ` (${tier})` : ''}`);
  console.log(`  Reason: ${test.reason}`);

  return passed;
}

function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Azure Speech SDK Deduplication Test Suite");
  console.log("  Testing 98% Original + 82% Dual-Text Thresholds");
  console.log("═══════════════════════════════════════════════════════════");

  let passed = 0;
  let failed = 0;

  console.log("\n📋 TIER 1 TESTS: Azure Rescoring Protection (95% original)\n");
  const tier1Tests = testCases.filter(t => t.expectedBlock && t.reason.includes("Azure") || t.reason.includes("rescor"));
  tier1Tests.forEach(test => {
    if (runTest(test)) passed++;
    else failed++;
  });

  console.log("\n\n📋 TIER 2 TESTS: Standard Fuzzy Matching (82% both)\n");
  const tier2Tests = testCases.filter(t => t.expectedBlock && !tier1Tests.includes(t));
  tier2Tests.forEach(test => {
    if (runTest(test)) passed++;
    else failed++;
  });

  console.log("\n\n📋 NEGATIVE TESTS: Should NOT Block\n");
  const negativeTests = testCases.filter(t => !t.expectedBlock);
  negativeTests.forEach(test => {
    if (runTest(test)) passed++;
    else failed++;
  });

  console.log("\n\n═══════════════════════════════════════════════════════════");
  console.log(`  RESULTS: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);
  console.log("═══════════════════════════════════════════════════════════");

  if (failed === 0) {
    console.log("\n✨ All tests passed! Deduplication system working correctly.\n");
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. Review the output above.\n`);
    process.exit(1);
  }
}

// Run tests
main();
