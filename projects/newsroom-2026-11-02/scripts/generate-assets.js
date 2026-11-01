const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const PROJECT_DIR = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(PROJECT_DIR, 'assets', 'images');
const VIDEO_DIR = path.join(PROJECT_DIR, 'assets', 'video');
const PRESENTER_DIR = path.join(PROJECT_DIR, 'assets', 'presenter');
const MANIFEST_DIR = path.join(PROJECT_DIR, 'manifests');

fs.mkdirSync(IMAGES_DIR, { recursive: true });
fs.mkdirSync(VIDEO_DIR, { recursive: true });
fs.mkdirSync(PRESENTER_DIR, { recursive: true });
fs.mkdirSync(MANIFEST_DIR, { recursive: true });

const fontBold = 'C\\:/Windows/Fonts/segoeuib.ttf';
const fontRegular = 'C\\:/Windows/Fonts/segoeui.ttf';

console.log('Generating Asset 1: fig1_search_architecture.png...');
const fig1Filters = [
  'drawbox=x=20:y=20:w=1040:h=920:color=0x090d16:t=fill',
  'drawbox=x=20:y=20:w=1040:h=920:color=0x1e293b:t=2',
  'drawbox=x=50:y=45:w=260:h=38:color=0x10b981:t=fill',
  `drawtext=fontfile='${fontBold}':text='TECHNICAL ARCHITECTURE':fontcolor=white:fontsize=18:x=65:y=56`,
  `drawtext=fontfile='${fontRegular}':text='OpenAI Engineering Release':fontcolor=0x34d399:fontsize=18:x=330:y=56`,
  `drawtext=fontfile='${fontBold}':text='ChatGPT Search - Real-Time Neural Grounding':fontcolor=white:fontsize=34:x=50:y=105`,

  // Box 1: Query Intent Classifier
  'drawbox=x=50:y=160:w=980:h=180:color=0x111827:t=fill',
  'drawbox=x=50:y=160:w=980:h=180:color=0x10b981@0.5:t=2',
  `drawtext=fontfile='${fontBold}':text='1. AUTONOMOUS SEARCH INTENT CLASSIFIER':fontcolor=0x34d399:fontsize=22:x=75:y=185`,
  'drawbox=x=75:y=225:w=430:h=95:color=0x1f2937:t=fill',
  `drawtext=fontfile='${fontBold}':text='Parametric Memory Branch':fontcolor=white:fontsize=19:x=95:y=245`,
  `drawtext=fontfile='${fontRegular}':text='Internalized reasoning and coding':fontcolor=0x9ca3af:fontsize=16:x=95:y=280`,
  'drawbox=x=535:y=225:w=470:h=95:color=0x1f2937:t=fill',
  `drawtext=fontfile='${fontBold}':text='Live Search Trigger Branch':fontcolor=0x38bdf8:fontsize=19:x=555:y=245`,
  `drawtext=fontfile='${fontRegular}':text='Current news, stock prices, weather, sports':fontcolor=0x9ca3af:fontsize=16:x=555:y=280`,

  // Arrow
  'drawbox=x=500:y=355:w=80:h=35:color=0x10b981:t=fill',
  `drawtext=fontfile='${fontBold}':text='DOWN':fontcolor=white:fontsize=14:x=520:y=365`,

  // Box 2: Fine-Tuned GPT-4o + o1 Distillation
  'drawbox=x=50:y=405:w=980:h=230:color=0x0f172a:t=fill',
  'drawbox=x=50:y=405:w=980:h=230:color=0x38bdf8@0.6:t=2',
  `drawtext=fontfile='${fontBold}':text='2. FINE-TUNED GPT-4o WITH o1 REASONING DISTILLATION':fontcolor=0x38bdf8:fontsize=22:x=75:y=425`,
  `drawtext=fontfile='${fontRegular}':text='Trained on synthetic search trajectories distilled from o1 reasoning models':fontcolor=0xbae6fd:fontsize=16:x=75:y=460`,
  'drawbox=x=75:y=495:w=430:h=115:color=0x0369a1@0.3:t=fill',
  `drawtext=fontfile='${fontBold}':text='Live Parallel Web Crawler':fontcolor=white:fontsize=18:x=95:y=515`,
  `drawtext=fontfile='${fontRegular}':text='Sub-second multi-source page fetch':fontcolor=0x7dd3fc:fontsize=16:x=95:y=550`,
  `drawtext=fontfile='${fontRegular}':text='Direct publisher API connectors':fontcolor=0x7dd3fc:fontsize=16:x=95:y=580`,
  'drawbox=x=535:y=495:w=470:h=115:color=0x0369a1@0.3:t=fill',
  `drawtext=fontfile='${fontBold}':text='Fact Extraction & Synthesis':fontcolor=white:fontsize=18:x=555:y=515`,
  `drawtext=fontfile='${fontRegular}':text='Cross-verifies conflicting web claims':fontcolor=0x7dd3fc:fontsize=16:x=555:y=550`,
  `drawtext=fontfile='${fontRegular}':text='Generates formatted answers in sub-seconds':fontcolor=0x7dd3fc:fontsize=16:x=555:y=580`,

  // Box 3: Output & Attribution
  'drawbox=x=50:y=655:w=980:h=165:color=0x18181b:t=fill',
  'drawbox=x=50:y=655:w=980:h=165:color=0xf59e0b@0.7:t=2',
  `drawtext=fontfile='${fontBold}':text='3. GROUNDED MULTIMODAL RESPONSE WITH SOURCES SIDEBAR':fontcolor=0xfbbf24:fontsize=22:x=75:y=675`,
  `drawtext=fontfile='${fontBold}':text='Interactive Visuals + Inline Publisher Attribution':fontcolor=white:fontsize=22:x=75:y=715`,
  `drawtext=fontfile='${fontRegular}':text='Weather Doppler maps, stock charts, sports tables, and verified partner links':fontcolor=0xd1d5db:fontsize=17:x=75:y=755`,
  `drawtext=fontfile='${fontRegular}':text='OpenAI Architectural Specification | Verified Primary Release':fontcolor=0x64748b:fontsize=15:x=50:y=890`
].join(',');

execFileSync('ffmpeg', [
  '-y', '-f', 'lavfi', '-i', 'color=c=0x07090e:s=1080x960:d=1',
  '-vf', fig1Filters,
  '-frames:v', '1', '-update', '1',
  path.join(IMAGES_DIR, 'fig1_search_architecture.png')
]);

console.log('Generating Asset 2: fig2_ten_blue_links_vs_ai.png...');
const fig2Filters = [
  'drawbox=x=20:y=20:w=1040:h=920:color=0x0f172a:t=fill',
  'drawbox=x=20:y=20:w=1040:h=920:color=0xef4444@0.5:t=2',
  'drawbox=x=50:y=45:w=320:h=38:color=0xd97706:t=fill',
  `drawtext=fontfile='${fontBold}':text='PARADIGM SHIFT':fontcolor=white:fontsize=18:x=70:y=56`,
  `drawtext=fontfile='${fontBold}':text='1998 vs 2024 - How Web Search Changed':fontcolor=white:fontsize=36:x=50:y=105`,
  `drawtext=fontfile='${fontRegular}':text='The 25-year inverted index model collides with real-time neural synthesis':fontcolor=0x94a3b8:fontsize=20:x=50:y=150`,

  // Left Column: Traditional Search
  'drawbox=x=50:y=200:w=465:h=580:color=0x18181b:t=fill',
  'drawbox=x=50:y=200:w=465:h=580:color=0xef4444@0.6:t=2',
  `drawtext=fontfile='${fontBold}':text='TRADITIONAL KEYWORD SEARCH':fontcolor=0xf87171:fontsize=22:x=75:y=225`,
  `drawtext=fontfile='${fontRegular}':text='Google Search Paradigm (1998 - 2024)':fontcolor=0xa1a1aa:fontsize=16:x=75:y=260`,
  'drawbox=x=75:y=295:w=415:h=70:color=0x450a0a@0.5:t=fill',
  `drawtext=fontfile='${fontBold}':text='Top 4 Results Are Sponsored Ads':fontcolor=0xfca5a5:fontsize=17:x=95:y=310`,
  `drawtext=fontfile='${fontRegular}':text='High ad clutter pushes real results down':fontcolor=0xfecaca:fontsize=15:x=95:y=340`,
  'drawbox=x=75:y=385:w=415:h=70:color=0x27272a:t=fill',
  `drawtext=fontfile='${fontBold}':text='10 Blue Links Format':fontcolor=white:fontsize=17:x=95:y=400`,
  `drawtext=fontfile='${fontRegular}':text='User forced to click into multiple tabs':fontcolor=0xa1a1aa:fontsize=15:x=95:y=430`,
  'drawbox=x=75:y=475:w=415:h=70:color=0x27272a:t=fill',
  `drawtext=fontfile='${fontBold}':text='SEO Farming & Affiliate Bloat':fontcolor=white:fontsize=17:x=95:y=490`,
  `drawtext=fontfile='${fontRegular}':text='Keyword stuffing compromises factual quality':fontcolor=0xa1a1aa:fontsize=15:x=95:y=520`,
  'drawbox=x=75:y=565:w=415:h=70:color=0x27272a:t=fill',
  `drawtext=fontfile='${fontBold}':text='Manual Fact Aggregation':fontcolor=white:fontsize=17:x=95:y=580`,
  `drawtext=fontfile='${fontRegular}':text='Average research task takes 8 to 15 minutes':fontcolor=0xa1a1aa:fontsize=15:x=95:y=610`,
  `drawtext=fontfile='${fontBold}':text='Status - Disrupted':fontcolor=0xf87171:fontsize=18:x=75:y=730`,

  // Right Column: ChatGPT Search
  'drawbox=x=565:y=200:w=465:h=580:color=0x0f291e:t=fill',
  'drawbox=x=565:y=200:w=465:h=580:color=0x10b981@0.7:t=2',
  `drawtext=fontfile='${fontBold}':text='CHATGPT CONVERSATIONAL SEARCH':fontcolor=0x34d399:fontsize=22:x=590:y=225`,
  `drawtext=fontfile='${fontRegular}':text='OpenAI Neural Search Paradigm (2024+)':fontcolor=0xa7f3d0:fontsize=16:x=590:y=260`,
  'drawbox=x=590:y=295:w=415:h=70:color=0x064e3b@0.6:t=fill',
  `drawtext=fontfile='${fontBold}':text='Zero Sponsored Ads':fontcolor=0x6ee7b7:fontsize=17:x=610:y=310`,
  `drawtext=fontfile='${fontRegular}':text='Direct factual answer without pay-to-play bias':fontcolor=0xa7f3d0:fontsize=15:x=610:y=340`,
  'drawbox=x=590:y=385:w=415:h=70:color=0x064e3b@0.4:t=fill',
  `drawtext=fontfile='${fontBold}':text='Direct Synthesized Answers':fontcolor=white:fontsize=17:x=610:y=400`,
  `drawtext=fontfile='${fontRegular}':text='Summarizes facts across multiple web sources':fontcolor=0xa7f3d0:fontsize=15:x=610:y=430`,
  'drawbox=x=590:y=475:w=415:h=70:color=0x064e3b@0.4:t=fill',
  `drawtext=fontfile='${fontBold}':text='Interactive Visual Data':fontcolor=white:fontsize=17:x=610:y=490`,
  `drawtext=fontfile='${fontRegular}':text='Live radar, interactive maps, dynamic stocks':fontcolor=0xa7f3d0:fontsize=15:x=610:y=520`,
  'drawbox=x=590:y=565:w=415:h=70:color=0x064e3b@0.4:t=fill',
  `drawtext=fontfile='${fontBold}':text='Transparent Source Attribution':fontcolor=white:fontsize=17:x=610:y=580`,
  `drawtext=fontfile='${fontRegular}':text='Inline favicons link directly to publishers':fontcolor=0xa7f3d0:fontsize=15:x=610:y=610`,
  `drawtext=fontfile='${fontBold}':text='Status - Live in Production':fontcolor=0x34d399:fontsize=18:x=590:y=730`,

  `drawtext=fontfile='${fontRegular}':text='Comparative Industry Analysis | OpenAI ChatGPT Search Release':fontcolor=0x64748b:fontsize=15:x=50:y=890`
].join(',');

execFileSync('ffmpeg', [
  '-y', '-f', 'lavfi', '-i', 'color=c=0x080b12:s=1080x960:d=1',
  '-vf', fig2Filters,
  '-frames:v', '1', '-update', '1',
  path.join(IMAGES_DIR, 'fig2_ten_blue_links_vs_ai.png')
]);

console.log('Generating Asset 3: fig3_publisher_partnerships.png...');
const fig3Filters = [
  'drawbox=x=20:y=20:w=1040:h=920:color=0x0f172a:t=fill',
  'drawbox=x=20:y=20:w=1040:h=920:color=0x38bdf8@0.5:t=2',
  'drawbox=x=50:y=45:w=320:h=38:color=0x0284c7:t=fill',
  `drawtext=fontfile='${fontBold}':text='PUBLISHER ECOSYSTEM':fontcolor=white:fontsize=18:x=68:y=56`,
  `drawtext=fontfile='${fontBold}':text='Direct Content Partnerships and Licensing':fontcolor=white:fontsize=36:x=50:y=105`,
  `drawtext=fontfile='${fontRegular}':text='How OpenAI reached agreements with major global journalistic institutions':fontcolor=0x94a3b8:fontsize=20:x=50:y=150`,

  // 6 Partner Badges
  'drawbox=x=50:y=200:w=300:h=160:color=0x1e293b:t=fill',
  'drawbox=x=50:y=200:w=300:h=160:color=0x38bdf8@0.4:t=2',
  `drawtext=fontfile='${fontBold}':text='REUTERS':fontcolor=white:fontsize=24:x=75:y=230`,
  `drawtext=fontfile='${fontRegular}':text='Global breaking news wire':fontcolor=0x94a3b8:fontsize=16:x=75:y=270`,
  `drawtext=fontfile='${fontBold}':text='Status - Real-Time Feed':fontcolor=0x34d399:fontsize=15:x=75:y=310`,

  'drawbox=x=390:y=200:w=300:h=160:color=0x1e293b:t=fill',
  'drawbox=x=390:y=200:w=300:h=160:color=0x38bdf8@0.4:t=2',
  `drawtext=fontfile='${fontBold}':text='FINANCIAL TIMES':fontcolor=white:fontsize=24:x=415:y=230`,
  `drawtext=fontfile='${fontRegular}':text='International business and markets':fontcolor=0x94a3b8:fontsize=16:x=415:y=270`,
  `drawtext=fontfile='${fontBold}':text='Status - Licensed Content':fontcolor=0x34d399:fontsize=15:x=415:y=310`,

  'drawbox=x=730:y=200:w=300:h=160:color=0x1e293b:t=fill',
  'drawbox=x=730:y=200:w=300:h=160:color=0x38bdf8@0.4:t=2',
  `drawtext=fontfile='${fontBold}':text='AXEL SPRINGER':fontcolor=white:fontsize=24:x=755:y=230`,
  `drawtext=fontfile='${fontRegular}':text='Politico and Business Insider':fontcolor=0x94a3b8:fontsize=16:x=755:y=270`,
  `drawtext=fontfile='${fontBold}':text='Status - Licensed Content':fontcolor=0x34d399:fontsize=15:x=755:y=310`,

  'drawbox=x=50:y=390:w=300:h=160:color=0x1e293b:t=fill',
  'drawbox=x=50:y=390:w=300:h=160:color=0x38bdf8@0.4:t=2',
  `drawtext=fontfile='${fontBold}':text='ASSOCIATED PRESS':fontcolor=white:fontsize=24:x=75:y=420`,
  `drawtext=fontfile='${fontRegular}':text='National and investigative coverage':fontcolor=0x94a3b8:fontsize=16:x=75:y=460`,
  `drawtext=fontfile='${fontBold}':text='Status - Archival and Live':fontcolor=0x34d399:fontsize=15:x=75:y=500`,

  'drawbox=x=390:y=390:w=300:h=160:color=0x1e293b:t=fill',
  'drawbox=x=390:y=390:w=300:h=160:color=0x38bdf8@0.4:t=2',
  `drawtext=fontfile='${fontBold}':text='LE MONDE':fontcolor=white:fontsize=24:x=415:y=420`,
  `drawtext=fontfile='${fontRegular}':text='European and French journalism':fontcolor=0x94a3b8:fontsize=16:x=415:y=460`,
  `drawtext=fontfile='${fontBold}':text='Status - Multi-Lingual':fontcolor=0x34d399:fontsize=15:x=415:y=500`,

  'drawbox=x=730:y=390:w=300:h=160:color=0x1e293b:t=fill',
  'drawbox=x=730:y=390:w=300:h=160:color=0x38bdf8@0.4:t=2',
  `drawtext=fontfile='${fontBold}':text='NEWS CORP':fontcolor=white:fontsize=24:x=755:y=420`,
  `drawtext=fontfile='${fontRegular}':text='WSJ and The Times coverage':fontcolor=0x94a3b8:fontsize=16:x=755:y=460`,
  `drawtext=fontfile='${fontBold}':text='Status - Multi-Year Accord':fontcolor=0x34d399:fontsize=15:x=755:y=500`,

  // Attribution Banner
  'drawbox=x=50:y=590:w=980:h=210:color=0x064e3b@0.3:t=fill',
  'drawbox=x=50:y=590:w=980:h=210:color=0x10b981@0.5:t=2',
  `drawtext=fontfile='${fontBold}':text='THE SOURCES SIDEBAR - DIRECT ATTRIBUTION':fontcolor=0x34d399:fontsize=22:x=75:y=615`,
  `drawtext=fontfile='${fontRegular}':text='Every factual assertion links directly to primary newsroom articles with publisher favicons':fontcolor=white:fontsize=18:x=75:y=655`,
  `drawtext=fontfile='${fontRegular}':text='Publishers retain control over snippet lengths and receive attribution visibility':fontcolor=0xa7f3d0:fontsize=17:x=75:y=695`,
  `drawtext=fontfile='${fontRegular}':text='Source - OpenAI Content Governance and Partner Announcements':fontcolor=0x64748b:fontsize=15:x=50:y=890`
].join(',');

execFileSync('ffmpeg', [
  '-y', '-f', 'lavfi', '-i', 'color=c=0x070b14:s=1080x960:d=1',
  '-vf', fig3Filters,
  '-frames:v', '1', '-update', '1',
  path.join(IMAGES_DIR, 'fig3_publisher_partnerships.png')
]);

console.log('Generating Asset 4: fig4_inference_cost_chart.png...');
const fig4Filters = [
  'drawbox=x=20:y=20:w=1040:h=920:color=0x0f172a:t=fill',
  'drawbox=x=20:y=20:w=1040:h=920:color=0xf59e0b@0.6:t=2',
  'drawbox=x=50:y=45:w=360:h=38:color=0xd97706:t=fill',
  `drawtext=fontfile='${fontBold}':text='THE COMPUTE BOTTLENECK':fontcolor=white:fontsize=18:x=68:y=56`,
  `drawtext=fontfile='${fontBold}':text='Cost Per Query - Keyword vs Neural':fontcolor=white:fontsize=36:x=50:y=105`,
  `drawtext=fontfile='${fontRegular}':text='Why serving 1 billion daily search queries strains GPU economics':fontcolor=0x94a3b8:fontsize=20:x=50:y=150`,

  // Comparison row 1: Traditional Keyword Search
  'drawbox=x=50:y=210:w=980:h=220:color=0x1c1917:t=fill',
  'drawbox=x=50:y=210:w=980:h=220:color=0x38bdf8@0.5:t=2',
  `drawtext=fontfile='${fontBold}':text='Traditional Keyword Search (Inverted Index)':fontcolor=0x38bdf8:fontsize=22:x=75:y=235`,
  `drawtext=fontfile='${fontRegular}':text='Commodity CPU hash map lookup with cached index rankings':fontcolor=0xd1d5db:fontsize=17:x=75:y=275`,
  // Visual bar: $0.0005 (very short bar)
  'drawbox=x=75:y=315:w=60:h=45:color=0x0284c7:t=fill',
  `drawtext=fontfile='${fontBold}':text='$0.0005':fontcolor=white:fontsize=18:x=145:y=327`,
  `drawtext=fontfile='${fontRegular}':text='Fraction of a cent per query | Highly profitable via search ads':fontcolor=0x94a3b8:fontsize=16:x=250:y=327`,
  `drawtext=fontfile='${fontRegular}':text='Economics - Funded by massive 90 Percent margin auction ad system':fontcolor=0xa8a29e:fontsize=16:x=75:y=380`,

  // Comparison row 2: Neural Conversational Search
  'drawbox=x=50:y=470:w=980:h=250:color=0x450a0a@0.3:t=fill',
  'drawbox=x=50:y=470:w=980:h=250:color=0xef4444@0.7:t=2',
  `drawtext=fontfile='${fontBold}':text='Neural Conversational Search (Fine-Tuned GPT-4o)':fontcolor=0xf87171:fontsize=22:x=75:y=495`,
  `drawtext=fontfile='${fontRegular}':text='Multi-token generation across hundreds of billions of transformer parameters':fontcolor=0xfca5a5:fontsize=17:x=75:y=535`,
  // Visual bar: $0.0200 (40x longer bar)
  'drawbox=x=75:y=575:w=720:h=45:color=0xb91c1c:t=fill',
  `drawtext=fontfile='${fontBold}':text='$0.0200 (40x MORE EXPENSIVE)':fontcolor=white:fontsize=20:x=90:y=587`,
  `drawtext=fontfile='${fontBold}':text='High Compute Strain':fontcolor=0xfca5a5:fontsize=17:x=810:y=587`,
  `drawtext=fontfile='${fontRegular}':text='Challenge - Scaling to 250M Plus users without subsidizing ad-free queries':fontcolor=white:fontsize=16:x=75:y=640`,
  `drawtext=fontfile='${fontRegular}':text='Publisher Impact - Referral click-throughs drop as AI answers questions on-page':fontcolor=0xfca5a5:fontsize=16:x=75:y=675`,

  `drawtext=fontfile='${fontRegular}':text='Financial Estimates | Industry Analysis & Morgan Stanley Equity Research':fontcolor=0x64748b:fontsize=15:x=50:y=890`
].join(',');

execFileSync('ffmpeg', [
  '-y', '-f', 'lavfi', '-i', 'color=c=0x0a0c14:s=1080x960:d=1',
  '-vf', fig4Filters,
  '-frames:v', '1', '-update', '1',
  path.join(IMAGES_DIR, 'fig4_inference_cost_chart.png')
]);

console.log('Generating Video Asset: demo_search_experience.mp4...');
const videoFilters = [
  'drawbox=x=0:y=0:w=1080:h=960:color=0x090d16:t=fill',
  'drawbox=x=30:y=30:w=1020:h=900:color=0x1e293b:t=2',
  'drawbox=x=50:y=50:w=440:h=44:color=0x10b981:t=fill',
  `drawtext=fontfile='${fontBold}':text='LIVE CHATGPT SEARCH DEMO':fontcolor=white:fontsize=20:x=70:y=62`,
  `drawtext=fontfile='${fontBold}':text='QUERY STATUS - GROUNDED':fontcolor=0x34d399:fontsize=20:x=720:y=62`,
  // Search Bar UI
  'drawbox=x=50:y=115:w=980:h=60:color=0x1f2937:t=fill',
  'drawbox=x=50:y=115:w=980:h=60:color=0x374151:t=2',
  `drawtext=fontfile='${fontBold}':text='Search Query - What is the latest weekend weather forecast and stock movement?':fontcolor=white:fontsize=18:x=75:y=135`,
  // Main Answer Card
  'drawbox=x=50:y=200:w=640:h=480:color=0x111827:t=fill',
  'drawbox=x=50:y=200:w=640:h=480:color=0x10b981@0.5:t=2',
  `drawtext=fontfile='${fontBold}':text='Synthesized Live Response':fontcolor=0x34d399:fontsize=20:x=75:y=225`,
  `drawtext=fontfile='${fontRegular}':text='Clear skies expected with a high of 72F. Markets closed higher today.':fontcolor=white:fontsize=17:x=75:y=265`,
  // Animated Stock Line Chart inside left panel
  'drawbox=x=75:y=310:w=590:h=180:color=0x0f172a:t=fill',
  'drawbox=x=75:y=310:w=590:h=180:color=0x334155:t=2',
  `drawtext=fontfile='${fontBold}':text='S and P 500 Real-Time Index':fontcolor=0x38bdf8:fontsize=16:x=95:y=325`,
  `drawtext=fontfile='${fontRegular}':text='Index Value - 5824.6 pts (All-Time High)':fontcolor=0x34d399:fontsize=18:x=95:y=360`,
  `drawbox=x='150+300*sin(t*1.2)':y='410+30*cos(t*2)':w=60:h=30:color=0x38bdf8@0.7:t=2`,
  `drawtext=fontfile='${fontBold}':text='LIVE':fontcolor=0x38bdf8:fontsize=13:x='160+300*sin(t*1.2)':y='418+30*cos(t*2)'`,
  // Right Sources Panel
  'drawbox=x=710:y=200:w=320:h=480:color=0x18181b:t=fill',
  'drawbox=x=710:y=200:w=320:h=480:color=0x38bdf8@0.5:t=2',
  `drawtext=fontfile='${fontBold}':text='SOURCES (4)':fontcolor=0x38bdf8:fontsize=18:x=730:y=225`,
  'drawbox=x=730:y=265:w=280:h=70:color=0x27272a:t=fill',
  `drawtext=fontfile='${fontBold}':text='1. Reuters Market Wire':fontcolor=white:fontsize=15:x=745:y=280`,
  `drawtext=fontfile='${fontRegular}':text='reuters.com | 12m ago':fontcolor=0x9ca3af:fontsize=13:x=745:y=305`,
  'drawbox=x=730:y=355:w=280:h=70:color=0x27272a:t=fill',
  `drawtext=fontfile='${fontBold}':text='2. Financial Times':fontcolor=white:fontsize=15:x=745:y=370`,
  `drawtext=fontfile='${fontRegular}':text='ft.com | 24m ago':fontcolor=0x9ca3af:fontsize=13:x=745:y=395`,
  'drawbox=x=730:y=445:w=280:h=70:color=0x27272a:t=fill',
  `drawtext=fontfile='${fontBold}':text='3. National Weather Service':fontcolor=white:fontsize=15:x=745:y=460`,
  `drawtext=fontfile='${fontRegular}':text='weather.gov | Live Doppler':fontcolor=0x9ca3af:fontsize=13:x=745:y=485`,
  // Bottom Telemetry Bar
  'drawbox=x=50:y=710:w=980:h=180:color=0x0f172a:t=fill',
  'drawbox=x=50:y=710:w=980:h=180:color=0x10b981@0.4:t=2',
  `drawtext=fontfile='${fontBold}':text='NEURAL GROUNDING ENGINE - SUB-SECOND RESOLUTION':fontcolor=0x34d399:fontsize=20:x=80:y=735`,
  `drawtext=fontfile='${fontRegular}':text='Model Latency - 420 ms | Search Roundtrip - 210 ms | Total - 630 ms':fontcolor=white:fontsize=18:x=80:y=775`,
  `drawtext=fontfile='${fontRegular}':text='Live multi-source synthesis eliminates 10 blue links navigation overhead':fontcolor=0x94a3b8:fontsize=16:x=80:y=815`,
  `drawtext=fontfile='${fontBold}':text='OpenAI ChatGPT Search Live Demonstration':fontcolor=0x64748b:fontsize=14:x=80:y=855`
].join(',');

execFileSync('ffmpeg', [
  '-y', '-f', 'lavfi', '-i', 'color=c=0x070a12:s=1080x960:r=30',
  '-vf', videoFilters,
  '-t', '10',
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
  path.join(VIDEO_DIR, 'demo_search_experience.mp4')
]);

console.log('Generating Presenter Asset: studio_background.png...');
// Realistic fixed AI research studio background plate (1080x960)
const studioFilters = [
  'drawbox=x=0:y=0:w=1080:h=960:color=0x0a0e17:t=fill',
  // Subtle dark studio wall panels
  'drawbox=x=40:y=40:w=1000:h=880:color=0x111827:t=fill',
  'drawbox=x=40:y=40:w=1000:h=880:color=0x1f2937:t=2',
  // Subtle ambient acoustic slat paneling on left
  'drawbox=x=60:y=60:w=25:h=840:color=0x1e293b:t=fill',
  'drawbox=x=100:y=60:w=25:h=840:color=0x1e293b:t=fill',
  'drawbox=x=140:y=60:w=25:h=840:color=0x1e293b:t=fill',
  'drawbox=x=180:y=60:w=25:h=840:color=0x1e293b:t=fill',
  // Soft ambient blue studio rim light in corner
  'drawbox=x=800:y=60:w=220:h=400:color=0x0284c7@0.15:t=fill',
  // Subtle bookshelf / workstation backdrop on right
  'drawbox=x=820:y=80:w=180:h=18:color=0x334155:t=fill',
  'drawbox=x=820:y=180:w=180:h=18:color=0x334155:t=fill',
  'drawbox=x=820:y=280:w=180:h=18:color=0x334155:t=fill',
  // Presenter Focus Frame (fixed, stable, non-warping)
  'drawbox=x=260:y=120:w=560:h=760:color=0x0b1120@0.5:t=fill',
  `drawtext=fontfile='${fontBold}':text='AI RESEARCH STUDIO - FIXED BACKGROUND PLATE':fontcolor=0x334155:fontsize=16:x=320:y=850`
].join(',');

execFileSync('ffmpeg', [
  '-y', '-f', 'lavfi', '-i', 'color=c=0x080c14:s=1080x960:d=1',
  '-vf', studioFilters,
  '-frames:v', '1', '-update', '1',
  path.join(PRESENTER_DIR, 'studio_background.png')
]);

console.log('All visual and presenter assets generated successfully!');
