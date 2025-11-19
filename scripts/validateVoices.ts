import axios from 'axios';
import fs from 'fs';
import path from 'path';

interface AzureVoice {
  Name: string;
  DisplayName: string;
  LocalName: string;
  ShortName: string;
  Gender: string;
  Locale: string;
  LocaleName: string;
  SampleRateHertz: string;
  VoiceType: string;
  Status: string;
}

async function fetchAzureVoices() {
  const region = 'eastus';
  const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list`;
  
  try {
    console.log('🔍 Fetching Azure voice catalog...');
    const response = await axios.get<AzureVoice[]>(url);
    const voices = response.data;
    
    console.log(`✅ Fetched ${voices.length} voices from Azure`);
    
    // Save to cache
    const cachePath = path.join(process.cwd(), 'cache', 'azureVoices.json');
    fs.writeFileSync(cachePath, JSON.stringify(voices, null, 2));
    console.log(`💾 Cached to ${cachePath}`);
    
    return voices;
  } catch (error: any) {
    console.error('❌ Failed to fetch Azure voices:', error.message);
    
    // Try to load from cache if available
    const cachePath = path.join(process.cwd(), 'cache', 'azureVoices.json');
    if (fs.existsSync(cachePath)) {
      console.log('📂 Loading from cache instead...');
      const cached = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
      return cached as AzureVoice[];
    }
    
    throw error;
  }
}

interface VoiceMapping {
  [locale: string]: {
    male: string;
    female: string;
  };
}

function extractRegionalVoices(): VoiceMapping {
  const roomTsPath = path.join(process.cwd(), 'client', 'src', 'pages', 'Room.tsx');
  const content = fs.readFileSync(roomTsPath, 'utf-8');
  
  // Extract the regionalVoices object
  const match = content.match(/const regionalVoices[^{]*{([^}]+(?:{[^}]+}[^}]*)*)/s);
  if (!match) {
    throw new Error('Could not find regionalVoices in Room.tsx');
  }
  
  const voicesStr = match[0];
  const voices: VoiceMapping = {};
  
  // Parse each entry like: "en-US": { male: "en-US-GuyNeural", female: "en-US-JennyNeural" },
  const entryRegex = /"([^"]+)":\s*{\s*male:\s*"([^"]+)",\s*female:\s*"([^"]+)"\s*}/g;
  let entryMatch;
  
  while ((entryMatch = entryRegex.exec(voicesStr)) !== null) {
    const [, locale, maleVoice, femaleVoice] = entryMatch;
    voices[locale] = { male: maleVoice, female: femaleVoice };
  }
  
  console.log(`📋 Extracted ${Object.keys(voices).length} voice mappings from Room.tsx`);
  return voices;
}

function validateVoices(azureVoices: AzureVoice[], regionalVoices: VoiceMapping) {
  console.log('\n🔍 Validating voice mappings...\n');
  
  // Build Azure voice lookup
  const azureVoiceSet = new Set(azureVoices.map(v => v.ShortName));
  const azureByLocale: { [locale: string]: AzureVoice[] } = {};
  
  for (const voice of azureVoices) {
    if (!azureByLocale[voice.Locale]) {
      azureByLocale[voice.Locale] = [];
    }
    azureByLocale[voice.Locale].push(voice);
  }
  
  const errors: string[] = [];
  const warnings: string[] = [];
  let validCount = 0;
  
  // Check each mapped voice
  for (const [locale, voices] of Object.entries(regionalVoices)) {
    const { male, female } = voices;
    
    // Check male voice
    if (!azureVoiceSet.has(male)) {
      errors.push(`❌ ${locale} MALE: "${male}" NOT FOUND in Azure catalog`);
    } else {
      validCount++;
    }
    
    // Check female voice
    if (!azureVoiceSet.has(female)) {
      errors.push(`❌ ${locale} FEMALE: "${female}" NOT FOUND in Azure catalog`);
    } else {
      validCount++;
    }
    
    // Check if locale exists in Azure
    const normalizedLocale = locale.toLowerCase().replace('_', '-');
    const azureLocale = Object.keys(azureByLocale).find(
      l => l.toLowerCase().replace('_', '-') === normalizedLocale
    );
    
    if (!azureLocale) {
      warnings.push(`⚠️  ${locale}: Locale not found in Azure (might be mapped to different locale)`);
    }
  }
  
  // Print results
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Valid voices: ${validCount}/${Object.keys(regionalVoices).length * 2}`);
  console.log(`❌ Invalid voices: ${errors.length}`);
  console.log(`⚠️  Warnings: ${warnings.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (errors.length > 0) {
    console.log('ERRORS:\n');
    errors.forEach(err => console.log(err));
    console.log('');
  }
  
  if (warnings.length > 0) {
    console.log('WARNINGS:\n');
    warnings.forEach(warn => console.log(warn));
    console.log('');
  }
  
  // Show available voices for errored locales
  if (errors.length > 0) {
    console.log('\n📚 SUGGESTED FIXES:\n');
    const erroredLocales = new Set(
      errors.map(e => e.split(' ')[1]).filter(Boolean)
    );
    
    for (const locale of erroredLocales) {
      const normalizedLocale = locale.toLowerCase().replace('_', '-');
      const azureLocale = Object.keys(azureByLocale).find(
        l => l.toLowerCase().replace('_', '-') === normalizedLocale
      );
      
      if (azureLocale) {
        const voices = azureByLocale[azureLocale];
        const maleVoices = voices.filter(v => v.Gender === 'Male');
        const femaleVoices = voices.filter(v => v.Gender === 'Female');
        
        console.log(`${locale}:`);
        if (maleVoices.length > 0) {
          console.log(`  Male options: ${maleVoices.map(v => v.ShortName).join(', ')}`);
        }
        if (femaleVoices.length > 0) {
          console.log(`  Female options: ${femaleVoices.map(v => v.ShortName).join(', ')}`);
        }
        console.log('');
      }
    }
  }
  
  return { errors, warnings, validCount };
}

async function main() {
  try {
    const azureVoices = await fetchAzureVoices();
    const regionalVoices = extractRegionalVoices();
    const results = validateVoices(azureVoices, regionalVoices);
    
    if (results.errors.length > 0) {
      console.log('❌ Validation FAILED - fix the errors above');
      process.exit(1);
    } else {
      console.log('✅ All voice mappings are VALID!');
      process.exit(0);
    }
  } catch (error: any) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

main();
