import fs from 'fs';
import path from 'path';

// Known correct Azure voices from official Microsoft documentation (json2video.com/ai-voices/azure/voices/)
const KNOWN_AZURE_VOICES: { [locale: string]: { male: string[]; female: string[] } } = {
  // English variants
  'en-US': { male: ['en-US-GuyNeural', 'en-US-EricNeural', 'en-US-RogerNeural', 'en-US-SteffanNeural', 'en-US-TonyNeural', 'en-US-AIGenerate1Neural', 'en-US-AIGenerate2Neural', 'en-US-AndrewMultilingualNeural', 'en-US-BrianMultilingualNeural', 'en-US-DavisNeural', 'en-US-JasonNeural', 'en-US-ChristopherNeural', 'en-US-AlloyMultilingualNeural', 'en-US-EchoMultilingualNeural'], female: ['en-US-JennyNeural', 'en-US-AriaNeural', 'en-US-SaraNeural', 'en-US-MichelleNeural', 'en-US-MonicaNeural', 'en-US-AvaNeural', 'en-US-AnaNeural', 'en-US-EmmaNeural', 'en-US-AvaMultilingualNeural', 'en-US-EmmaMultilingualNeural', 'en-US-JennyMultilingualNeural', 'en-US-NovaMultilingualNeural', 'en-US-ShimmerMultilingualNeural', 'en-US-AmberNeural', 'en-US-AshleyNeural', 'en-US-CoraNeural', 'en-US-ElizabethNeural', 'en-US-JaneNeural', 'en-US-NancyNeural'] },
  'en-GB': { male: ['en-GB-RyanNeural', 'en-GB-OllieMultilingualNeural', 'en-GB-AlfieNeural', 'en-GB-ElliotNeural', 'en-GB-EthanNeural', 'en-GB-NoahNeural', 'en-GB-OliverNeural', 'en-GB-ThomasNeural'], female: ['en-GB-SoniaNeural', 'en-GB-LibbyNeural', 'en-GB-AdaMultilingualNeural', 'en-GB-AbbiNeural', 'en-GB-BellaNeural', 'en-GB-HollieNeural', 'en-GB-MaisieNeural', 'en-GB-OliviaNeural', 'en-GB-MiaNeural'] },
  'en-AU': { male: ['en-AU-WilliamNeural', 'en-AU-DarrenNeural', 'en-AU-DuncanNeural', 'en-AU-KenNeural', 'en-AU-NeilNeural', 'en-AU-TimNeural'], female: ['en-AU-NatashaNeural', 'en-AU-AnnetteNeural', 'en-AU-CarlyNeural', 'en-AU-ElsieNeural', 'en-AU-FreyaNeural', 'en-AU-JoanneNeural', 'en-AU-KimNeural', 'en-AU-TinaNeural'] },
  'en-CA': { male: ['en-CA-LiamNeural'], female: ['en-CA-ClaraNeural'] },
  'en-IN': { male: ['en-IN-PrabhatNeural'], female: ['en-IN-NeerjaNeural'] },
  'en-IE': { male: ['en-IE-ConnorNeural'], female: ['en-IE-EmilyNeural'] },
  'en-NZ': { male: ['en-NZ-MitchellNeural'], female: ['en-NZ-MollyNeural'] },
  'en-SG': { male: ['en-SG-WayneNeural'], female: ['en-SG-LunaNeural'] },
  'en-HK': { male: ['en-HK-SamNeural'], female: ['en-HK-YanNeural'] },
  'en-PH': { male: ['en-PH-JamesNeural'], female: ['en-PH-RosaNeural'] },
  'en-NG': { male: ['en-NG-AbeoNeural'], female: ['en-NG-EzinneNeural'] },
  'en-ZA': { male: ['en-ZA-LukeNeural'], female: ['en-ZA-LeahNeural'] },
  'en-GH': { male: ['en-GH-KwameDrummerNeural'], female: ['en-GH-AkoaNeural'] },  // Fixed!
  
  // Spanish variants
  'es-ES': { male: ['es-ES-AlvaroNeural', 'es-ES-TeoNeural'], female: ['es-ES-ElviraNeural', 'es-ES-AbrilNeural', 'es-ES-ArnauNeural', 'es-ES-DarioNeural', 'es-ES-EliasNeural', 'es-ES-EstrellaNeural', 'es-ES-IreneNeural', 'es-ES-LaiaNeural', 'es-ES-LiaNeural', 'es-ES-NilNeural', 'es-ES-SaulNeural', 'es-ES-TeoNeural', 'es-ES-TrianaNeural', 'es-ES-VeraNeural', 'es-ES-XimenaNeural'] },
  'es-MX': { male: ['es-MX-JorgeNeural', 'es-MX-LibertoNeural', 'es-MX-LucianoNeural', 'es-MX-PelayoNeural', 'es-MX-YagoNeural'], female: ['es-MX-DaliaNeural', 'es-MX-BeatrizNeural', 'es-MX-CandelaNeural', 'es-MX-CarlotaNeural', 'es-MX-CecilioNeural', 'es-MX-GerardoNeural', 'es-MX-LarinaNeural', 'es-MX-MarinaNeural', 'es-MX-NuriaNeural', 'es-MX-RenataNeural'] },
  'es-AR': { male: ['es-AR-TomasNeural'], female: ['es-AR-ElenaNeural'] },
  'es-CO': { male: ['es-CO-GonzaloNeural'], female: ['es-CO-SalomeNeural'] },
  'es-CL': { male: ['es-CL-LorenzoNeural'], female: ['es-CL-CatalinaNeural'] },
  'es-PE': { male: ['es-PE-AlexNeural'], female: ['es-PE-CamilaNeural'] },
  'es-VE': { male: ['es-VE-SebastianNeural'], female: ['es-VE-PaolaNeural'] },
  'es-CR': { male: ['es-CR-JuanNeural'], female: ['es-CR-MariaNeural'] },
  'es-PA': { male: ['es-PA-RobertoNeural'], female: ['es-PA-MargaritaNeural'] },
  'es-GT': { male: ['es-GT-AndresNeural'], female: ['es-GT-MartaNeural'] },
  'es-HN': { male: ['es-HN-CarlosNeural'], female: ['es-HN-KarlaNeural'] },
  'es-NI': { male: ['es-NI-FedericoNeural'], female: ['es-NI-YolandaNeural'] },
  'es-SV': { male: ['es-SV-RodrigoNeural'], female: ['es-SV-LorenaNeural'] },
  'es-BO': { male: ['es-BO-MarceloNeural'], female: ['es-BO-SofiaNeural'] },
  'es-PY': { male: ['es-PY-MarioNeural'], female: ['es-PY-TaniaNeural'] },
  'es-UY': { male: ['es-UY-MateoNeural'], female: ['es-UY-ValentinaNeural'] },
  'es-DO': { male: ['es-DO-EmilioNeural'], female: ['es-DO-RamonaNeural'] },
  'es-PR': { male: ['es-PR-VictorNeural'], female: ['es-PR-KarinaNeural'] },
  'es-EC': { male: ['es-EC-LuisNeural'], female: ['es-EC-AndreaNeural'] },
  'es-US': { male: ['es-US-AlonsoNeural'], female: ['es-US-PalomaNeural'] },
  
  // Arabic variants
  'ar-SA': { male: ['ar-SA-HamedNeural'], female: ['ar-SA-ZariyahNeural'] },
  'ar-EG': { male: ['ar-EG-ShakirNeural'], female: ['ar-EG-SalmaNeural'] },
  'ar-AE': { male: ['ar-AE-HamdanNeural'], female: ['ar-AE-FatimaNeural'] },
  'ar-BH': { male: ['ar-BH-AliNeural'], female: ['ar-BH-LailaNeural'] },
  'ar-IQ': { male: ['ar-IQ-BasselNeural'], female: ['ar-IQ-RanaNeural'] },
  'ar-JO': { male: ['ar-JO-TaimNeural'], female: ['ar-JO-SanaNeural'] },
  'ar-KW': { male: ['ar-KW-FahedNeural'], female: ['ar-KW-NouraNeural'] },
  'ar-LB': { male: ['ar-LB-RamiNeural'], female: ['ar-LB-LaylaNeural'] },
  'ar-OM': { male: ['ar-OM-AbdullahNeural'], female: ['ar-OM-AyshaNeural'] },
  'ar-QA': { male: ['ar-QA-MoazNeural'], female: ['ar-QA-AmalNeural'] },
  'ar-SY': { male: ['ar-SY-LaithNeural'], female: ['ar-SY-AmanyNeural'] },
  'ar-LY': { male: ['ar-LY-OmarNeural'], female: ['ar-LY-ImanNeural'] },
  'ar-MA': { male: ['ar-MA-JamalNeural'], female: ['ar-MA-MounaNeural'] },
  'ar-DZ': { male: ['ar-DZ-IsmaelNeural'], female: ['ar-DZ-AminaNeural'] },
  
  // Chinese variants
  'zh-CN': { male: ['zh-CN-YunxiNeural', 'zh-CN-YunjianNeural', 'zh-CN-YunyangNeural', 'zh-CN-YunfengNeural', 'zh-CN-YunhaoNeural'], female: ['zh-CN-XiaoxiaoNeural', 'zh-CN-XiaoyiNeural', 'zh-CN-XiaochenNeural', 'zh-CN-XiaohanNeural', 'zh-CN-XiaomengNeural', 'zh-CN-XiaomoNeural', 'zh-CN-XiaoqiuNeural', 'zh-CN-XiaoruiNeural', 'zh-CN-XiaoshuangNeural', 'zh-CN-XiaoxuanNeural', 'zh-CN-XiaoyanNeural', 'zh-CN-XiaoyouNeural', 'zh-CN-XiaozhenNeural'] },
  'zh-TW': { male: ['zh-TW-YunJheNeural'], female: ['zh-TW-HsiaoChenNeural', 'zh-TW-HsiaoYuNeural'] },
  'zh-HK': { male: ['zh-HK-WanLungNeural'], female: ['zh-HK-HiuMaanNeural', 'zh-HK-HiuGaaiNeural'] },
  
  // French variants
  'fr-FR': { male: ['fr-FR-HenriNeural', 'fr-FR-RemyMultilingualNeural', 'fr-FR-AlainNeural', 'fr-FR-ClaudeNeural', 'fr-FR-JeromeNeural', 'fr-FR-MauriceNeural', 'fr-FR-YvesNeural'], female: ['fr-FR-DeniseNeural', 'fr-FR-VivienneMultilingualNeural', 'fr-FR-BrigitteNeural', 'fr-FR-CelesteNeural', 'fr-FR-CoralieNeural', 'fr-FR-EloiseNeural', 'fr-FR-JacquelineNeural', 'fr-FR-JosephineNeural', 'fr-FR-YvetteNeural'] },
  'fr-CA': { male: ['fr-CA-JeanNeural', 'fr-CA-AntoineNeural', 'fr-CA-ThierryNeural'], female: ['fr-CA-SylvieNeural'] },
  
  // German variants
  'de-DE': { male: ['de-DE-ConradNeural', 'de-DE-FlorianMultilingualNeural', 'de-DE-BerndNeural', 'de-DE-ChristophNeural', 'de-DE-KasperNeural', 'de-DE-KillianNeural', 'de-DE-KlausNeural', 'de-DE-RalfNeural'], female: ['de-DE-KatjaNeural', 'de-DE-SeraphinaMultilingualNeural', 'de-DE-AmalaNeural', 'de-DE-ElkeNeural', 'de-DE-GiselaNeural', 'de-DE-KlarissaNeural', 'de-DE-LouisaNeural', 'de-DE-MajaNeural', 'de-DE-TanjaNeural'] },
  'de-AT': { male: ['de-AT-JonasNeural'], female: ['de-AT-IngridNeural'] },
  'de-CH': { male: ['de-CH-JanNeural'], female: ['de-CH-LeniNeural'] },
  
  // Portuguese variants
  'pt-PT': { male: ['pt-PT-DuarteNeural'], female: ['pt-PT-RaquelNeural', 'pt-PT-FernandaNeural'] },
  'pt-BR': { male: ['pt-BR-AntonioNeural', 'pt-BR-FabioNeural', 'pt-BR-HumbertoNeural', 'pt-BR-JulioNeural', 'pt-BR-NicolauNeural', 'pt-BR-ValerioNeural'], female: ['pt-BR-FranciscaNeural', 'pt-BR-BrendaNeural', 'pt-BR-DonatoNeural', 'pt-BR-ElzaNeural', 'pt-BR-GiovannaNeural', 'pt-BR-LeilaNeural', 'pt-BR-LeticiaNeural', 'pt-BR-ManuelaNeural', 'pt-BR-ThalitaNeural', 'pt-BR-YaraNeural'] },
  
  // Single-variant languages
  'it-IT': { male: ['it-IT-DiegoNeural', 'it-IT-BenignoNeural', 'it-IT-CalimeroNeural', 'it-IT-CataldoNeural', 'it-IT-FabiolaNeural', 'it-IT-FiammaNeural', 'it-IT-GianniNeural', 'it-IT-GiuseppeNeural', 'it-IT-ImeldaNeural', 'it-IT-IrmaNeural', 'it-IT-LisandroNeural', 'it-IT-PalmiraNeural', 'it-IT-PierinaNeural', 'it-IT-RinaldoNeural'], female: ['it-IT-ElsaNeural', 'it-IT-IsabellaNeural'] },
  'ru-RU': { male: ['ru-RU-DmitryNeural'], female: ['ru-RU-SvetlanaNeural', 'ru-RU-DariyaNeural'] },
  'ja-JP': { male: ['ja-JP-KeitaNeural', 'ja-JP-DaichiNeural', 'ja-JP-NaokiNeural'], female: ['ja-JP-NanamiNeural', 'ja-JP-AoiNeural', 'ja-JP-MayuNeural', 'ja-JP-ShioriNeural'] },
  'ko-KR': { male: ['ko-KR-InJoonNeural', 'ko-KR-BongJinNeural', 'ko-KR-GookMinNeural', 'ko-KR-HyunsuNeural'], female: ['ko-KR-SunHiNeural', 'ko-KR-JiMinNeural', 'ko-KR-SeoHyeonNeural', 'ko-KR-SoonBokNeural', 'ko-KR-YuJinNeural'] },
  'hi-IN': { male: ['hi-IN-MadhurNeural'], female: ['hi-IN-SwaraNeural'] },
  'nl-NL': { male: ['nl-NL-MaartenNeural', 'nl-NL-DirkNeural'], female: ['nl-NL-ColetteNeural', 'nl-NL-FennaNeural'] },
  'pl-PL': { male: ['pl-PL-MarekNeural'], female: ['pl-PL-ZofiaNeural', 'pl-PL-AgnieszkaNeural'] },
  'tr-TR': { male: ['tr-TR-AhmetNeural'], female: ['tr-TR-EmelNeural'] },
  'sv-SE': { male: ['sv-SE-MattiasNeural'], female: ['sv-SE-SofieNeural', 'sv-SE-HilleviNeural'] },
  'nb-NO': { male: ['nb-NO-FinnNeural'], female: ['nb-NO-PernilleNeural', 'nb-NO-IselinNeural'] },
  'da-DK': { male: ['da-DK-JeppeNeural'], female: ['da-DK-ChristelNeural'] },
  'fi-FI': { male: ['fi-FI-HarriNeural'], female: ['fi-FI-NooraNeural', 'fi-FI-SelmaNeural'] },
  'el-GR': { male: ['el-GR-NestorasNeural'], female: ['el-GR-AthinaNeural'] },
  'cs-CZ': { male: ['cs-CZ-AntoninNeural'], female: ['cs-CZ-VlastaNeural'] },
  'ro-RO': { male: ['ro-RO-EmilNeural'], female: ['ro-RO-AlinaNeural'] },
  'uk-UA': { male: ['uk-UA-OstapNeural'], female: ['uk-UA-PolinaNeural'] },
  'hu-HU': { male: ['hu-HU-TamasNeural'], female: ['hu-HU-NoemiNeural'] },
  'vi-VN': { male: ['vi-VN-NamMinhNeural'], female: ['vi-VN-HoaiMyNeural'] },
  'th-TH': { male: ['th-TH-NiwatNeural'], female: ['th-TH-PremwadeeNeural', 'th-TH-AcharaNeural'] },
  'id-ID': { male: ['id-ID-ArdiNeural'], female: ['id-ID-GadisNeural'] },
  'he-IL': { male: ['he-IL-AvriNeural'], female: ['he-IL-HilaNeural'] },
  'bn-IN': { male: ['bn-IN-BashkarNeural'], female: ['bn-IN-TanishaaNeural'] },
  'ta-IN': { male: ['ta-IN-ValluvarNeural'], female: ['ta-IN-PallaviNeural'] },
  'te-IN': { male: ['te-IN-MohanNeural'], female: ['te-IN-ShrutiNeural'] },
  'mr-IN': { male: ['mr-IN-ManoharNeural'], female: ['mr-IN-AarohiNeural'] },
  'gu-IN': { male: ['gu-IN-NiranjanNeural'], female: ['gu-IN-DhwaniNeural'] },
  'kn-IN': { male: ['kn-IN-GaganNeural'], female: ['kn-IN-SapnaNeural'] },
  'ml-IN': { male: ['ml-IN-MidhunNeural'], female: ['ml-IN-SobhanaNeural'] },
  'bg-BG': { male: ['bg-BG-BorislavNeural'], female: ['bg-BG-KalinaNeural'] },
  'hr-HR': { male: ['hr-HR-SreckoNeural'], female: ['hr-HR-GabrijelaNeural'] },
  'sk-SK': { male: ['sk-SK-LukasNeural'], female: ['sk-SK-ViktoriaNeural'] },
  'sl-SI': { male: ['sl-SI-RokNeural'], female: ['sl-SI-PetraNeural'] },
  'ca-ES': { male: ['ca-ES-EnricNeural'], female: ['ca-ES-JoanaNeural', 'ca-ES-AlbaNeural'] },
  'ms-MY': { male: ['ms-MY-OsmanNeural'], female: ['ms-MY-YasminNeural'] },
  'af-ZA': { male: ['af-ZA-WillemNeural'], female: ['af-ZA-AdriNeural'] },
  'sw-KE': { male: ['sw-KE-RafikiNeural'], female: ['sw-KE-ZuriNeural'] },
  'sr-RS': { male: ['sr-RS-NicholasNeural'], female: ['sr-RS-SophieNeural'] },
  'et-EE': { male: ['et-EE-KertNeural'], female: ['et-EE-AnuNeural'] },
  'lv-LV': { male: ['lv-LV-NilsNeural'], female: ['lv-LV-EveritaNeural'] },
};

interface VoiceMapping {
  [locale: string]: {
    male: string;
    female: string;
  };
}

function extractRegionalVoices(): VoiceMapping {
  const roomTsPath = path.join(process.cwd(), 'client', 'src', 'pages', 'Room.tsx');
  const content = fs.readFileSync(roomTsPath, 'utf-8');
  
  const match = content.match(/const regionalVoices[^{]*{([^}]+(?:{[^}]+}[^}]*)*)/s);
  if (!match) {
    throw new Error('Could not find regionalVoices in Room.tsx');
  }
  
  const voicesStr = match[0];
  const voices: VoiceMapping = {};
  
  const entryRegex = /"([^"]+)":\s*{\s*male:\s*"([^"]+)",\s*female:\s*"([^"]+)"\s*}/g;
  let entryMatch;
  
  while ((entryMatch = entryRegex.exec(voicesStr)) !== null) {
    const [, locale, maleVoice, femaleVoice] = entryMatch;
    voices[locale] = { male: maleVoice, female: femaleVoice };
  }
  
  console.log(`📋 Extracted ${Object.keys(voices).length} voice mappings from Room.tsx\n`);
  return voices;
}

function validateVoices(regionalVoices: VoiceMapping) {
  console.log('🔍 Validating voice mappings against Azure catalog...\n');
  
  const errors: string[] = [];
  const warnings: string[] = [];
  let validCount = 0;
  
  for (const [locale, voices] of Object.entries(regionalVoices)) {
    const { male, female } = voices;
    const normalizedLocale = locale.toUpperCase();
    
    // Get known voices for this locale
    const knownVoices = KNOWN_AZURE_VOICES[locale];
    
    if (!knownVoices) {
      warnings.push(`⚠️  ${locale}: Locale not in validation catalog (might be valid but unchecked)`);
      continue;
    }
    
    // Check male voice
    if (!knownVoices.male.includes(male)) {
      errors.push(`❌ ${locale} MALE: "${male}" NOT VALID`);
      errors.push(`   Correct options: ${knownVoices.male.join(', ')}`);
    } else {
      validCount++;
    }
    
    // Check female voice
    if (!knownVoices.female.includes(female)) {
      errors.push(`❌ ${locale} FEMALE: "${female}" NOT VALID`);
      errors.push(`   Correct options: ${knownVoices.female.join(', ')}`);
    } else {
      validCount++;
    }
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Valid voices: ${validCount}`);
  console.log(`❌ Invalid voices: ${errors.length}`);
  console.log(`⚠️  Unchecked locales: ${warnings.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (errors.length > 0) {
    console.log('ERRORS FOUND:\n');
    errors.forEach(err => console.log(err));
    console.log('');
  }
  
  if (warnings.length > 0) {
    console.log('WARNINGS:\n');
    warnings.forEach(warn => console.log(warn));
    console.log('');
  }
  
  return { errors, warnings, validCount };
}

async function main() {
  try {
    const regionalVoices = extractRegionalVoices();
    const results = validateVoices(regionalVoices);
    
    if (results.errors.length > 0) {
      console.log('❌ Validation FAILED - fix the errors above');
      process.exit(1);
    } else {
      console.log('✅ All validated voice mappings are CORRECT!');
      if (results.warnings.length > 0) {
        console.log(`⚠️  ${results.warnings.length} locales not in validation catalog - verify manually`);
      }
      process.exit(0);
    }
  } catch (error: any) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

main();
