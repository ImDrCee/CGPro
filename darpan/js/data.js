/* Jan Darpan · reference data. Roles, handles and dates come from public sources and must be verified by a curator. */
(function (g) {
  const CGP = (g.CGP = g.CGP || {});

  const D = (id, name, hi, tile, weight, note, kw, seats) => ({ id, name, hi, tile, weight, note, kw, seats });
  CGP.ref = {
    state: 'Chhattisgarh', cm: 'Vishnu Deo Sai',
    districts: [
      D('raipur', 'Raipur', 'रायपुर', [2, 2], 1.7, 'State capital', 'raipur|रायपुर|नवा रायपुर|naya raipur|atal nagar', ['Raipur City North', 'Raipur City South', 'Raipur City West', 'Raipur Rural', 'Abhanpur', 'Arang', 'Dharsiwa']),
      D('durg', 'Durg', 'दुर्ग', [1, 2], 1.3, 'Bhilai steel belt', 'durg|bhilai|दुर्ग|भिलाई|charoda|चरोदा', ['Durg City', 'Durg Rural', 'Bhilai Nagar', 'Vaishali Nagar', 'Ahiwara', 'Patan']),
      D('bilaspur', 'Bilaspur', 'बिलासपुर', [1, 1], 1.3, 'High Court, rail zone', 'bilaspur|बिलासपुर', ['Bilaspur', 'Bilha', 'Beltara', 'Takhatpur', 'Masturi', 'Kota']),
      D('korba', 'Korba', 'कोरबा', [2, 1], 1.0, 'Coal and power', 'korba|कोरबा|katghora|कटघोरा|dipka|दीपका', ['Korba', 'Katghora', 'Pali-Tanakhar', 'Rampur']),
      D('raigarh', 'Raigarh', 'रायगढ़', [3, 0], 1.0, 'Mining and industry', 'raigarh|रायगढ़|रायगढ|dharamjaigarh|धरमजयगढ़', ['Raigarh', 'Kharsia', 'Dharamjaigarh', 'Lailunga']),
      D('rajnandgaon', 'Rajnandgaon', 'राजनांदगांव', [0, 2], 0.9, 'Paddy and urban mix', 'rajnandgaon|राजनांदगांव|dongargarh|डोंगरगढ़', ['Rajnandgaon', 'Dongargarh', 'Dongargaon', 'Khujji']),
      D('bastar', 'Bastar', 'बस्तर', [2, 3], 0.9, 'Tribal belt, Naxal-to-development', 'bastar|jagdalpur|बस्तर|जगदलपुर', ['Jagdalpur', 'Chitrakot', 'Bastar', 'Bakawand']),
      D('dantewada', 'Dantewada', 'दंतेवाड़ा', [2, 4], 0.6, 'Security camps to schools', 'dantewada|दंतेवाड़ा|दंतेवाडा|dantewara', ['Dantewada']),
      D('surguja', 'Surguja', 'सरगुजा', [1, 0], 0.8, 'North tribal region', 'surguja|सरगुजा|ambikapur|अंबिकापुर|अम्बिकापुर', ['Ambikapur', 'Lundra', 'Sitapur']),
      D('janjgir', 'Janjgir-Champa', 'जांजगीर-चांपा', [3, 1], 0.9, 'Major paddy belt', 'janjgir|champa|जांजगीर|चांपा|जाँजगीर', ['Janjgir-Champa', 'Akaltara', 'Jaijaipur', 'Pamgarh'])
    ],
    otherPlaces: 'dhamtari|धमतरी|mahasamund|महासमुंद|balod|बालोद|baloda bazar|बलौदाबाजार|gariaband|गरियाबंद|kawardha|कवर्धा|kabirdham|कबीरधाम|mungeli|मुंगेली|jashpur|जशपुर|koriya|कोरिया|surajpur|सूरजपुर|balrampur|बलरामपुर|sukma|सुकमा|bijapur|बीजापुर|narayanpur|नारायणपुर|kanker|कांकेर|kondagaon|कोंडागांव|gaurela|गौरेला|manendragarh|मनेंद्रगढ़|sarangarh|सारंगढ़|khairagarh|खैरागढ़|mohla|मोहला',

    topics: [
      { id: 'women', name: 'Women Empowerment', short: 'Women', scheme: 'Mahtari Vandan', kw: 'women|mahtari|ladies|महतारी|महिला|ekyc|नारी|बेटी|लाड़ली' },
      { id: 'housing', name: 'Housing', short: 'Housing', scheme: 'PM Awas', kw: 'awas|housing|\\bhouses?\\b|आवास|मकान' },
      { id: 'farmers', name: 'Farmers & Paddy', short: 'Farmers', scheme: 'Dhan Kharidi', kw: 'farmer|paddy|\\bdhan\\b|\\bmsp\\b|krishak|agri|किसान|धान|मंडी|खरीदी|कृषि|खाद|उर्वरक|fertili[sz]er|समर्थन मूल्य' },
      { id: 'bastar', name: 'Bastar & Naxalism', short: 'Bastar', scheme: 'Niyad Nellanar', kw: 'bastar|naxal|maoist|niyad|nellanar|surrender|बस्तर|नक्सल|माओवादी|नियद|आत्मसमर्पण|एनकाउंटर|encounter|\\bdrg\\b' },
      { id: 'health', name: 'Health', short: 'Health', scheme: 'Ayushman Bharat', kw: 'health|hospital|doctor|ayushman|medicine|स्वास्थ्य|अस्पताल|डॉक्टर|आयुष्मान|दवा|मेडिकल' },
      { id: 'education', name: 'Education', short: 'Education', scheme: 'School Education', kw: 'school|teacher|education|student|शिक्षा|स्कूल|शिक्षक|छात्र|विद्यालय|कॉलेज|university|विश्वविद्यालय' },
      { id: 'law', name: 'Law & Order', short: 'Law & Order', scheme: '', kw: 'law and order|\\bcrime\\b|police|theft|assault|murder|rape|क्राइम|पुलिस|हत्या|चोरी|दुष्कर्म|लूट|कानून व्यवस्था|गिरफ्तार|arrest' },
      { id: 'power', name: 'Power & Electricity', short: 'Power', scheme: '', kw: 'power cut|electric|outage|bijli|substation|बिजली|कटौती|सबस्टेशन|cspdcl|ट्रांसफार्मर|transformer' },
      { id: 'jobs', name: 'Jobs & Recruitment', short: 'Jobs', scheme: '', kw: '\\bjobs?\\b|recruit|employment|vacanc|रोजगार|भर्ती|बेरोजगार|परीक्षा|व्यापम|vyapam|\\bcgpsc\\b|पीएससी|युवा' },
      { id: 'drugs', name: 'Drugs & Opium', short: 'Drugs', scheme: '', kw: 'drug|opium|narcotic|ganja|नशा|अफीम|गांजा|नशीले|नशे|नारकोटिक्स' },
      { id: 'corruption', name: 'Corruption Allegations', short: 'Corruption', scheme: '', kw: 'corrupt|scam|tender|irregular|भ्रष्टाचार|घोटाला|टेंडर|कमीशन|\\bed raid|\\bacb\\b|\\beow\\b|liquor scam|coal scam' },
      { id: 'infra', name: 'Roads & Infrastructure', short: 'Infra', scheme: '', kw: '\\broads?\\b|bridge|highway|flyover|सड़क|पुल|हाईवे|रेल|railway|एयरपोर्ट|airport' },
      { id: 'tribal', name: 'Tribal Rights & Mining', short: 'Tribal', scheme: 'Forest Rights', kw: 'tribal|mining|adivasi|land acquisition|hasdeo|हसदेव|आदिवासी|खनन|वन भूमि|कोयला खदान|पेड़ कटाई' },
      { id: 'water', name: 'Drinking Water', short: 'Water', scheme: 'Jal Jeevan', kw: 'drinking water|water supply|jal jeevan|पेयजल|पानी|जल जीवन|नल जल|जलसंकट' },
      { id: 'governance', name: 'Governance & CM Outreach', short: 'Governance', scheme: '', kw: 'cabinet|assembly|विधानसभा|कैबिनेट|मंत्रिमंडल|बजट|budget|दौरा|cm visit|समीक्षा बैठक|मुख्यमंत्री' },
      { id: 'culture', name: 'Culture & Events', short: 'Culture', scheme: '', kw: 'culture|festival|rajyotsava|उत्सव|राज्योत्सव|मेला|महोत्सव|संस्कृति|cricket|खेल' }
    ],

    channels: [
      { id: 'X', abbr: 'X', color: '#5B5BF0' }, { id: 'Facebook', abbr: 'Fb', color: '#3BA7FF' }, { id: 'Instagram', abbr: 'Ig', color: '#FF5DA2' },
      { id: 'YouTube', abbr: 'Yt', color: '#FF7A59' }, { id: 'News · Print', abbr: 'Pr', color: '#FFB020' }, { id: 'News · Online', abbr: 'Web', color: '#14C48B' }
    ],
    speakers: {
      govt: { label: 'Government', color: '#F5A524' }, bjp: { label: 'BJP', color: '#FB7C3C' }, opp: { label: 'Opposition', color: '#3BA7FF' },
      media: { label: 'Media', color: '#8A63F5' }, citizen: { label: 'Citizens', color: '#94A3B8' }
    },

    leaders: [
      { id: 'cm', name: 'Vishnu Deo Sai', role: 'Chief Minister', party: 'BJP', group: 'govt', kw: 'vishnu\\s?deo\\s?sai|vishnudeo|cm sai|chief minister sai|विष्णु\\s?देव\\s?साय|विष्णुदेव|सीएम साय|मुख्यमंत्री साय' },
      { id: 'dcm1', name: 'Arun Sao', role: 'Deputy Chief Minister', party: 'BJP', group: 'govt', kw: 'arun sao|arun sav|अरुण साव' },
      { id: 'dcm2', name: 'Vijay Sharma', role: 'Deputy Chief Minister', party: 'BJP', group: 'govt', kw: 'vijay sharma|विजय शर्मा' },
      { id: 'lop', name: 'Charandas Mahant', role: 'Leader of Opposition', party: 'INC', group: 'opp', kw: 'charandas mahant|charan das mahant|चरणदास महंत|चरण दास महंत' },
      { id: 'bb', name: 'Bhupesh Baghel', role: 'Former CM · MLA, Patan', party: 'INC', group: 'opp', kw: 'bhupesh baghel|भूपेश बघेल|बघेल' },
      { id: 'db', name: 'Deepak Baij', role: 'PCC President', party: 'INC', group: 'opp', kw: 'deepak baij|दीपक बैज' },
      { id: 'ts', name: 'T.S. Singh Deo', role: 'Former Deputy CM', party: 'INC', group: 'opp', kw: 'singh deo|singhdeo|सिंहदेव|टीएस सिंह' }
    ],

    // Entities used for common-factor detection (departments, bodies). Names are matched in titles.
    entities: [
      { name: 'CSPDCL (power distribution)', kw: 'cspdcl|power company|बिजली कंपनी|सीएसपीडीसीएल|पावर कंपनी' },
      { name: 'Municipal corporation', kw: 'municipal corporation|नगर निगम|नगर पालिका' },
      { name: 'Markfed / procurement centres', kw: 'markfed|मार्कफेड|खरीदी केंद्र|procurement centre|procurement center|समिति' },
      { name: 'Public Works Dept', kw: '\\bpwd\\b|public works|लोक निर्माण' },
      { name: 'Health Dept / CGMSC', kw: 'cgmsc|health department|स्वास्थ्य विभाग' },
      { name: 'Education Dept', kw: 'education department|शिक्षा विभाग|डीईओ' },
      { name: 'Food Dept (PDS)', kw: 'food department|खाद्य विभाग|राशन|\\bpds\\b' },
      { name: 'Forest Dept', kw: 'forest department|वन विभाग' },
      { name: 'Coal / SECL', kw: 'secl|एसईसीएल|coal|कोयला' },
      { name: 'Steel / NMDC / BSP', kw: 'nmdc|एनएमडीसी|bhilai steel|भिलाई स्टील|\\bbsp\\b' },
      { name: 'Contractor / agency', kw: 'contractor|ठेकेदार|एजेंसी|कंपनी पर' },
      { name: 'Police / DRG', kw: '\\bdrg\\b|police|पुलिस|थाना' }
    ],

    // Canonical issues. The live tagger picks the first issue of the detected topic whose pattern matches.
    issues: [
      { name: 'Mahtari Vandan eKYC delays', topic: 'women', pol: -1, kw: '(महतारी|mahtari).*(ekyc|e-kyc|केवाईसी|बायोमेट्रिक|biometric)|(ekyc|केवाईसी).*(महतारी|mahtari)' },
      { name: 'Rumour: Mahtari Vandan stopping', topic: 'women', pol: -1, kw: '(महतारी|mahtari).*(बंद|अफवाह|rumou?r|discontinu)' },
      { name: 'Mahtari Vandan exclusion allegations', topic: 'women', pol: -1, kw: '(महतारी|mahtari).*(पात्र|बाहर|कट|हटा|आरोप|exclu|dropped|irregular|गड़बड़|फर्जी)' },
      { name: 'Mahtari Vandan payouts on time', topic: 'women', pol: 1, kw: '(महतारी|mahtari).*(किस्त|installment|instalment|राशि|खाते|credited|transfer|जारी|released|भुगतान)' },
      { name: 'PM Awas instalment delays', topic: 'housing', pol: -1, kw: '(आवास|awas).*(किस्त|लंबित|रुका|अटका|pending|delay|instalment)' },
      { name: 'PM Awas survey list errors', topic: 'housing', pol: -1, kw: '(आवास|awas).*(सर्वे|सूची|list|survey|पात्र)' },
      { name: 'PM Awas handovers', topic: 'housing', pol: 1, kw: '(आवास|awas).*(गृह प्रवेश|सौंपा|handover|चाबी|स्वीकृत|मंजूर|sanction)' },
      { name: 'Paddy procurement scam allegations', topic: 'farmers', pol: -1, kw: '(धान|paddy|खरीदी).*(घोटाला|scam|गड़बड़|भ्रष्टाचार|irregular|धांधली|कमीशन|जांच)' },
      { name: 'Paddy procurement delays', topic: 'farmers', pol: -1, kw: '(धान|paddy|खरीदी|उठाव|टोकन|token).*(देरी|परेशान|किसान|लंबी कतार|queue|delay|उठाव|बारदाना|सूखत|शॉर्टेज|shortage)' },
      { name: 'Paddy procurement payouts', topic: 'farmers', pol: 1, kw: '(धान|paddy).*(भुगतान|payment|बोनस|bonus|राशि|जारी|released|एमएसपी|msp|3100)' },
      { name: 'Krishak Unnati uptake', topic: 'farmers', pol: 1, kw: 'कृषक उन्नति|krishak unnati' },
      { name: 'Fertiliser shortage', topic: 'farmers', pol: -1, kw: '(खाद|उर्वरक|fertili[sz]er|यूरिया|urea|डीएपी|dap).*(किल्लत|संकट|shortage|कतार|परेशान|कमी)' },
      { name: 'Camps converted to schools and hospitals', topic: 'bastar', pol: 1, kw: '(कैंप|camp).*(स्कूल|अस्पताल|school|hospital)' },
      { name: 'Surrender and rehabilitation', topic: 'bastar', pol: 1, kw: 'आत्मसमर्पण|सरेंडर|surrender|पुनर्वास|rehabilitat' },
      { name: 'Naxal encounters', topic: 'bastar', pol: 0, kw: 'मुठभेड़|एनकाउंटर|encounter|ढेर|killed|आईईडी|\\bied\\b|नक्सली मारे' },
      { name: 'Niyad Nellanar progress', topic: 'bastar', pol: 0, kw: 'नियद|niyad|nellanar' },
      { name: 'Bastar development pace', topic: 'bastar', pol: -1, kw: '(बस्तर|bastar).*(सड़क|स्वास्थ्य|विकास|road|clinic).*(नहीं|कमी|अभाव|slow)' },
      { name: 'Power outages', topic: 'power', pol: -1, kw: 'कटौती|बिजली गुल|अघोषित|power cut|outage|blackout|load shedding|ट्रिपिंग|बिजली संकट' },
      { name: 'New substations', topic: 'power', pol: 1, kw: 'सबस्टेशन|substation|नया ट्रांसफार्मर' },
      { name: 'Drugs and opium cultivation', topic: 'drugs', pol: -1, kw: 'अफीम|opium|नशे का कारोबार|ड्रग्स|drug trade|नशा' },
      { name: 'Narcotics seizures', topic: 'drugs', pol: 1, kw: 'जब्त|पकड़ा|seiz|गांजा|ganja|तस्कर|smuggl' },
      { name: 'Tender and contract allegations', topic: 'corruption', pol: -1, kw: 'टेंडर|tender|ठेका|contract|कमीशन' },
      { name: 'Mining and land acquisition protests', topic: 'tribal', pol: -1, kw: 'हसदेव|hasdeo|खनन|mining|भूमि अधिग्रहण|land acquisition|पेड़ कटाई|ग्रामसभा|विरोध' },
      { name: 'Law and order incidents', topic: 'law', pol: -1, kw: 'हत्या|दुष्कर्म|लूट|चोरी|हमला|murder|rape|assault|robbery|law and order|कानून व्यवस्था|अपराध' },
      { name: 'Police action on crime', topic: 'law', pol: 1, kw: 'गिरफ्तार|arrest|आरोपी|crackdown|धरपकड़|पकड़ा' },
      { name: 'Doctor and medicine shortage', topic: 'health', pol: -1, kw: '(डॉक्टर|doctor|दवा|medicine|स्टाफ|staff).*(कमी|अभाव|shortage|नहीं)' },
      { name: 'Ayushman health camps', topic: 'health', pol: 1, kw: 'आयुष्मान|ayushman|स्वास्थ्य शिविर|health camp' },
      { name: 'Teacher vacancies and school merger', topic: 'education', pol: -1, kw: '(शिक्षक|teacher).*(कमी|पद|vacan|युक्तिकरण|merger)|स्कूल (मर्ज|विलय)|युक्तिकरण' },
      { name: 'Recruitment exams and jobs', topic: 'jobs', pol: -1, kw: 'भर्ती|परीक्षा|व्यापम|पीएससी|cgpsc|vyapam|recruit|बेरोजगार' },
      { name: 'Drinking water shortage', topic: 'water', pol: -1, kw: '(पानी|पेयजल|water).*(किल्लत|संकट|shortage|crisis|बूंद|परेशान)|जलसंकट' },
      { name: 'Roads and bridge delays', topic: 'infra', pol: -1, kw: '(सड़क|पुल|road|bridge).*(खराब|गड्ढे|देरी|बदहाल|टूटी|damaged|delay|पोल)' },
      { name: 'Road and bridge sanctions', topic: 'infra', pol: 1, kw: '(सड़क|पुल|road|bridge).*(स्वीकृत|मंजूर|लोकार्पण|भूमिपूजन|sanction|inaugurat)' },
      { name: 'CM district visit', topic: 'governance', pol: 1, kw: 'दौरा|visit|समीक्षा बैठक|लोकार्पण|भूमिपूजन' },
      { name: 'Announcements versus delivery', topic: 'governance', pol: -1, kw: 'वादा|घोषणा.*(अधूरी|हवा)|खोखली|jumla|जुमला|promise' },
      { name: 'Naxal-free push', topic: 'bastar', pol: 1, broad: true, kw: 'नक्सल मुक्त|नक्सलवाद|naxalism|naxal.free|नक्सली|naxal|maoist|माओवादी' },
      { name: 'Cabinet decisions', topic: 'governance', pol: 1, broad: true, kw: 'कैबिनेट|cabinet|मंत्रिमंडल' },
      { name: 'Assembly proceedings', topic: 'governance', pol: 0, broad: true, kw: 'विधानसभा|assembly|सदन|विधायक' },
      { name: 'Investment and industry', topic: 'governance', pol: 1, broad: true, kw: 'निवेश|invest|उद्योग|industr|mou|एमओयू|रोजगार मेला' },
      { name: 'Political war of words', topic: 'governance', pol: -1, broad: true, kw: 'पलटवार|निशाना|हमला बोला|आरोप-प्रत्यारोप|hits out|slams|attacks|war of words|तंज' },
      { name: 'CM review and directions', topic: 'governance', pol: 0, broad: true, kw: 'समीक्षा|निर्देश|directs|reviews|बैठक|meeting' },
      { name: 'Farm support and irrigation', topic: 'farmers', pol: 1, broad: true, kw: 'सिंचाई|irrigation|कृषि|agricultur|किसानों' },
      { name: 'Road accidents', topic: 'law', pol: -1, broad: true, kw: 'हादसा|दुर्घटना|accident|टक्कर|collision' },
      { name: 'Hospital and health services', topic: 'health', pol: 0, broad: true, kw: 'अस्पताल|hospital|मेडिकल कॉलेज|medical college|स्वास्थ्य' },
      { name: 'Power supply news', topic: 'power', pol: 0, broad: true, kw: 'बिजली|power|electric' },
      { name: 'Education news', topic: 'education', pol: 0, broad: true, kw: 'शिक्षा|स्कूल|school|student|छात्र|college' },
      { name: 'Women welfare news', topic: 'women', pol: 1, broad: true, kw: 'महिला|women|महतारी|mahtari' },
      { name: 'Housing news', topic: 'housing', pol: 0, broad: true, kw: 'आवास|housing|awas' },
      { name: 'Crime and policing', topic: 'law', pol: -1, broad: true, kw: 'पुलिस|police|क्राइम|crime|गिरफ्तार|arrest' }
    ],

    // Lexicons for auto-tagging live headlines (labelled "auto, unverified" in the app).
    lex: {
      neg: 'घोटाला|भ्रष्टाचार|आरोप|विरोध|प्रदर्शन|आक्रोश|नाराज|हादसा|मौत|लापरवाही|कटौती|संकट|किल्लत|बदहाल|अव्यवस्था|धांधली|गड़बड़|हमला|हत्या|दुष्कर्म|वसूली|ठप|परेशान|आंदोलन|घेराव|नाकाम|विफल|फर्जी|कतार|जांच की मांग|scam|corrupt|alleg|protest|slam|attack|crisis|shortage|outage|irregular|died|death|accident|negligen|collapse|clash|controvers|probe|dies|killed|fraud|fake|delay|backlash|questions',
      pos: 'उद्घाटन|लोकार्पण|सौगात|राहत|सम्मान|बधाई|उपलब्धि|सफल|शुभारंभ|मंजूर|स्वीकृत|खुशखबरी|बढ़ोतरी|विकास|भूमिपूजन|inaugurat|launch|approv|sanction|boost|relief|success|award|praise|welcome|milestone|benefit|honou?r|surrender',
      opp: '(कांग्रेस|बघेल|महंत|बैज|सिंहदेव|विपक्ष|congress|baghel|mahant|baij|singh deo|opposition)[^,।\\-|]{0,30}(ने |का |के |की |says|slams|alleges|attacks|hits out|demands|questions|targets|accus|claims|blames|दावा|आरोप|निशाना|घेरा|सवाल|बोले|कहा|मांग|हमला|पलटवार)',
      govt: '(साय|मुख्यमंत्री|सीएम|उपमुख्यमंत्री|अरुण साव|विजय शर्मा|मंत्री|सरकार|chief minister|cm sai|minister|government)[^,।\\-|]{0,25}(ने |का |के |की |says|announces|inaugurates|directs|orders|approves|launches|reviews|निर्देश|घोषणा|लोकार्पण|शुभारंभ|समीक्षा|बैठक|दौरा|कहा)',
      bjp: 'भाजपा|bjp'
    },

    // Typical seasons. Real seasonality is computed from the archive; this only annotates it.
    calendar: [
      { id: 'paddy', name: 'Paddy procurement season', from: [11, 1], to: [1, 31], issues: ['Paddy procurement delays', 'Paddy procurement payouts', 'Paddy procurement scam allegations'], note: 'Kharif marketing season typically starts 1 Nov.' },
      { id: 'summer', name: 'Summer power and water peak', from: [4, 1], to: [6, 15], issues: ['Power outages', 'Drinking water shortage'], note: 'Peak demand months.' },
      { id: 'monsoon', name: 'Monsoon', from: [6, 15], to: [9, 30], issues: ['Roads and bridge delays', 'Drinking water shortage'], note: 'Waterlogging, road damage, fertiliser demand.' },
      { id: 'rajyotsava', name: 'Chhattisgarh Rajyotsava (1 Nov)', from: [11, 1], to: [11, 1], issues: ['CM district visit'], note: 'State formation day.' },
      { id: 'budget', name: 'Budget session (typical)', from: [2, 15], to: [3, 31], issues: ['Announcements versus delivery'], note: 'Assembly sessions drive opposition attack lines.' },
      { id: 'mansession', name: 'Monsoon assembly session (typical)', from: [7, 1], to: [7, 31], issues: [], note: 'Typically July.' }
    ],

    // Roles with valid-from / valid-to. Approximate, from public reports; verify before external use.
    roleHistory: [
      { who: 'Vishnu Deo Sai', role: 'Chief Minister', from: '2023-12-13', to: null },
      { who: 'Bhupesh Baghel', role: 'Chief Minister', from: '2018-12-17', to: '2023-12-13' },
      { who: 'Arun Sao', role: 'Deputy Chief Minister', from: '2023-12-13', to: null },
      { who: 'Vijay Sharma', role: 'Deputy Chief Minister', from: '2023-12-13', to: null },
      { who: 'T.S. Singh Deo', role: 'Deputy Chief Minister', from: '2023-06', to: '2023-12-13' },
      { who: 'Charandas Mahant', role: 'Speaker, Vidhan Sabha', from: '2018-12', to: '2023-12' },
      { who: 'Charandas Mahant', role: 'Leader of Opposition', from: '2023-12', to: null },
      { who: 'Deepak Baij', role: 'PCC President', from: '2023-07', to: null }
    ],

    // Real-world seed commitments (from public reports found during research). A curator must verify them.
    commitments: [
      { id: 'CM1', text: 'Mahtari Vandan: ₹1,000 a month to eligible married women through DBT', who: 'State government (BJP)', announced: '2024', deadline: null, budget: '', kw: 'महतारी वंदन|mahtari vandan', place: 'Statewide', seed: true, note: 'Reported scale: over 67 lakh women (public reports; verify).' },
      { id: 'CM2', text: 'Complete biometric eKYC of Mahtari Vandan beneficiaries by 30 June 2026', who: 'State government (BJP)', announced: '2026', deadline: '2026-06-30', budget: '', kw: '(महतारी|mahtari).*(ekyc|e-kyc|केवाईसी|biometric|बायोमेट्रिक)', place: 'Statewide', seed: true, note: 'Payments reported to continue only after eKYC.' },
      { id: 'CM3', text: 'End Naxal insurgency in Bastar by 31 March 2026', who: 'Union and State governments', announced: '2024', deadline: '2026-03-31', budget: '', kw: 'नक्सल मुक्त|naxal.free|naxal-free|नक्सलवाद.*(खात्मा|समाप्त)|end.*naxal', place: 'Bastar division', seed: true, note: 'Officials reported ~96% of Bastar Naxal-free by March 2026 with 30–40 cadres remaining (public reports).' },
      { id: 'CM4', text: 'Convert about 400 security camps in Bastar into schools, hospitals and public infrastructure', who: 'State government (BJP)', announced: '2026', deadline: null, budget: '', kw: '(कैंप|camp).*(स्कूल|अस्पताल|school|hospital)', place: 'Bastar division', seed: true, note: 'Reported by Times of India, March 2026.' }
    ],

    mediaCatalog: [
      { name: 'Hari Bhoomi', type: 'Newspaper', lang: 'Hindi', tier: 1, air: 9.66, site: 'haribhoomi.com', x: 'haribhoomicom', fb: 'Haribhoomi', ig: '', yt: '@haribhoomitv', clip: { pages: 370, ed: 'Raipur, Jagdalpur and New Delhi desks', url: 'epaper.haribhoomi.com' }, match: 'haribhoomi|हरिभूमि' },
      { name: 'Dainik Bhaskar', type: 'Newspaper', lang: 'Hindi', tier: 1, air: 7.87, site: 'bhaskar.com', x: 'dainikbhaskar', fb: 'dainikbhaskar', ig: '', yt: 'channel/UCVZ57OkKPAuRJ_wA_Rt4XFg', clip: { pages: 150, ed: 'Raipur, Bastar Bhaskar' }, match: 'bhaskar|भास्कर' },
      { name: 'Navbharat (Chhattisgarh)', type: 'Newspaper', lang: 'Hindi', tier: 1, air: 6.69, site: 'navabharat.news', x: '', fb: '', ig: '', yt: '', clip: { pages: 398, ed: 'Raipur Main, Rajdhani, Nyaydhani', url: 'epaper.navabharat.news' }, match: 'navbharat|नवभारत|nava bharat' },
      { name: 'Patrika', type: 'Newspaper', lang: 'Hindi', tier: 2, air: 4.21, site: 'patrika.com', x: 'PatrikaNews', fb: 'patrikahindinews', ig: 'rajasthan_patrika', yt: '@RajasthanPatrikaTV', clip: { pages: 159, ed: 'Chhattisgarh edition', url: 'patrika.com' }, match: 'patrika|पत्रिका' },
      { name: 'Nai Dunia', type: 'Newspaper', lang: 'Hindi', tier: 2, air: 2.54, site: 'naidunia.com', x: 'Nai_Dunia', fb: 'NaiDunia', ig: '', yt: '@NaiDunia-NavDunia', clip: { pages: 208, ed: 'Raipur, state bureau' }, match: 'nai ?dunia|नईदुनिया|नई दुनिया' },
      { name: 'Deshbandhu', type: 'Newspaper', lang: 'Hindi', tier: 2, air: null, site: 'deshbandhu.co.in', x: 'newsdeshbandhu', fb: 'dbliveofficial', ig: 'dblive.official', yt: 'c/DBLive', match: 'deshbandhu|देशबंधु' },
      { name: 'Dainik Chhattisgarh', type: 'Newspaper', lang: 'Hindi', tier: 3, air: null, site: 'dainikchhattisgarh.com', x: 'DainikChha63244', fb: 'profile.php?id=61554862072847', ig: 'dainikchhattisgarh', yt: '', match: 'dainik chhattisgarh|दैनिक छत्तीसगढ़' },
      { name: 'Swadesh', type: 'Newspaper', lang: 'Hindi', tier: 3, air: null, site: 'swadeshnews.in', x: 'DainikSwadesh', fb: 'DainikSwadesh', ig: 'dainik_swadesh', yt: '@swadeshnews', match: 'swadesh|स्वदेश', clip: { pages: 1, ed: 'On the clippings cover; one clipping' } },
      { name: 'Amar Ujala', type: 'Newspaper', lang: 'Hindi', tier: 3, air: null, site: 'amarujala.com', x: 'AmarUjalaNews', fb: 'Amarujala', ig: 'amarujala', yt: 'user/NewsAmarujala', match: 'amar ujala|अमर उजाला' },
      { name: 'The Hitavada', type: 'Newspaper', lang: 'English', tier: 2, air: null, site: 'thehitavada.com', x: 'TheHitavada1911', fb: 'hitavada', ig: 'thehitavada', yt: '@TheHitavada1911', clip: { pages: 0, ed: 'On the clippings cover; no English clippings in these 16 issues' }, match: 'hitavada' },
      { name: 'Times of India (Raipur)', type: 'Newspaper', lang: 'English', tier: 2, air: null, site: 'timesofindia.indiatimes.com', x: 'toicitiesnews', fb: 'TimesofIndia', ig: 'timesofindia', yt: 'timesofindia', match: 'times of india|toi' },
      { name: 'Central Chronicle', type: 'Newspaper', lang: 'English', tier: 3, air: null, site: 'centralchronicle.com', x: '', fb: '', ig: '', yt: '', match: 'central chronicle' },
      { name: 'IBC24', type: 'TV / digital', lang: 'Hindi', tier: 1, air: null, site: 'ibc24.in', x: 'IBC24News', fb: 'IBC24News', ig: 'ibc24.in', yt: '@IBC24InNews', match: 'ibc ?24' },
      { name: 'Bansal News', type: 'TV / digital', lang: 'Hindi', tier: 2, air: null, site: 'bansalnews.com', x: 'BansalNews_', fb: 'Bansalnewsdigital', ig: 'bansalnewsmpcg', yt: 'bansalnewsofficial', match: 'bansal' },
      { name: 'Lalluram', type: 'Digital portal', lang: 'Hindi', tier: 2, air: null, site: 'lalluram.com', x: 'lalluram_news', fb: 'lalluram.india', ig: 'lalluramnews', yt: 'c/LalluramNews', match: 'lalluram' },
      { name: 'Zee MP-CG', type: 'TV / digital', lang: 'Hindi', tier: 2, air: null, site: 'zeenews.india.com', x: '', fb: '', ig: '', yt: '', match: 'zee' },
      { name: 'Khabar36', type: 'Digital portal', lang: 'Hindi', tier: 3, air: null, site: 'khabar36.com', x: '', fb: '', ig: '', yt: '', match: 'khabar36|khabar chhattisgarh' },
      { name: 'Live Hindustan', type: 'National', lang: 'Hindi', tier: 3, air: null, site: 'livehindustan.com', x: 'Live_Hindustan', fb: 'LiveHindustanNews', ig: 'livehindustan', yt: '@Livehindustan', match: 'hindustan' },
      { name: 'Dainik Jagran', type: 'National', lang: 'Hindi', tier: 3, air: null, site: 'jagran.com', x: 'JagranNews', fb: 'dainikjagran', ig: '', yt: '', match: 'jagran|जागरण' },
      { name: 'Navbharat Times', type: 'National', lang: 'Hindi', tier: 3, air: null, site: 'navbharattimes.indiatimes.com', x: 'navbharattimes', fb: 'navbharattimes', ig: 'nbt_news', yt: '', match: 'navbharat times' },
      { name: 'News18 Hindi', type: 'National', lang: 'Hindi', tier: 3, air: null, site: 'hindi.news18.com', x: 'news18india', fb: 'news18india', ig: 'news18hindi', yt: 'c/news18India', match: 'news18' },
      { name: 'Free Press Journal', type: 'National', lang: 'English', tier: 3, air: null, site: 'freepressjournal.in', x: 'fpjindia', fb: 'freepressjournal', ig: 'freepressjournal', yt: '', match: 'free press' }
    ],
    // Aggregates from the team's manually compiled daily newspaper clippings (OCR keyword counts; approximate, no clipping text kept).
    clipStats: {
      issues: 16, clippings: 1286, from: '2026-09-23', to: '2026-10-10',
      note: 'Scanned clippings were read with OCR. Topic shares are keyword matches, so they overlap and are approximate.',
      topics: [['CM and government', 28], ['BJP organisation', 26], ['PM Modi and the Centre', 24], ['Law and order, crime', 22], ['Congress and opposition', 20], ['Education and schools', 19], ['Health', 16], ['Mahtari Vandan, women', 15], ['Naxal, Bastar', 14], ['Jobs, recruitment', 14], ['Roads, rail, infrastructure', 13], ['SIR, voter list, election commission', 12], ['Industry, investment', 10], ['Farmers, paddy, fertiliser', 9], ['Municipal and panchayat elections', 7], ['Tribal affairs, reservation', 6], ['Power, electricity', 6], ['Coal, mining, Hasdeo', 4], ['Scams and agencies', 4], ['Drugs', 4]],
      places: [['Raipur', 691], ['New Delhi', 240], ['Bastar', 161], ['Bilaspur', 122], ['Durg', 107], ['Bhilai', 68], ['Jagdalpur', 63], ['Dhamtari', 48], ['Surguja', 46], ['Rajnandgaon', 43], ['Korba', 40], ['Kanker', 35], ['Raigarh', 31], ['Sukma', 31]]
    },
    govHandles: [
      { platform: 'X', handle: '@vishnudsai', owner: 'Chief Minister', status: 'verified' },
      { platform: 'X', handle: '@ChhattisgarhCMO', owner: 'CM Office', status: 'verified' },
      { platform: 'Facebook', handle: 'ChhattisgarhCMO', owner: 'CM Office', status: 'verified' },
      { platform: 'X', handle: '@DPRChhattisgarh', owner: 'Directorate of Public Relations', status: 'verified' },
      { platform: 'Facebook', handle: 'DPRChhattisgarh', owner: 'Directorate of Public Relations', status: 'verified' },
      { platform: 'X / Facebook / Instagram', handle: 'BJP Chhattisgarh state unit', owner: 'Party', status: 'todo' },
      { platform: 'X / Facebook / Instagram', handle: 'Congress Chhattisgarh state unit', owner: 'Opposition', status: 'todo' },
      { platform: 'X / Facebook / Instagram', handle: 'Mahant, Baghel, Baij, Singh Deo', owner: 'Opposition leaders', status: 'todo' }
    ],

    roles: [
      { id: 'social', label: 'Social media lead', code: 'P4', mode: 'Operator', home: 'social', blurb: 'What to post, amplify or counter, and when.', quick: [['Amplification candidates', 'nav:social'], ['Is a claim recycled?', 'ask:Any rumours or misinformation spreading?'], ['What is trending?', 'ask:Which posts got the best traction?']] },
      { id: 'war', label: 'War room strategist', code: 'P2', mode: 'Navigator', home: 'voices', blurb: 'Which attacks to rebut, and how.', quick: [['Attack lines this week', 'nav:voices'], ['Rebuttal board', 'nav:voices'], ['What worked last time?', 'nav:memory']] },
      { id: 'spokes', label: 'Spokesperson & research', code: 'P5', mode: 'Navigator', home: 'voices', blurb: 'Facts and records for debates.', quick: [['Statement record', 'nav:voices'], ['Promise vs delivery', 'nav:promises'], ['Debate prep pack', 'nav:voices']] },
      { id: 'leader', label: 'Party leadership', code: 'P1', mode: 'Consumer', home: 'brief', blurb: 'Two-minute brief with history and precedent.', quick: [['Today\'s brief', 'nav:brief'], ['What changed vs last year?', 'ask:Compare this week with the same period last year'], ['Which districts need attention?', 'nav:districts']] },
      { id: 'mla', label: 'MLA / candidate office', code: 'P3', mode: 'Navigator', home: 'people', blurb: 'Constituency pulse and term-long record.', quick: [['Constituency dossier', 'nav:people'], ['Local issues', 'nav:districts'], ['Has this happened before?', 'nav:memory']] },
      { id: 'cm', label: 'CM / CMO', code: 'G1', mode: 'Consumer', home: 'brief', blurb: 'Statewide pulse, early warning, precedent.', quick: [['Morning brief', 'nav:brief'], ['Critical alerts', 'nav:pulse'], ['Promises due soon', 'nav:promises']] },
      { id: 'analyst', label: 'Media cell analyst', code: 'G8', mode: 'Operator', home: 'library', blurb: 'Review AI tags, compose the brief.', quick: [['Review queue', 'nav:library:review'], ['Add a link', 'nav:library:links'], ['Compose brief', 'nav:brief']] }
    ],

    connectors: [
      { name: 'Public news feeds', desc: 'Headlines, links and dates from news sites and portals, with a 12-month archive.', state: 'live' },
      { name: 'YouTube channel feeds', desc: 'Latest videos with public view counts for followed channels.', state: 'live' },
      { name: 'Daily newspaper clippings', desc: 'The team\'s daily clippings, read and tagged like any other item, with the clipping linked.', state: 'live' },
      { name: 'Link library', desc: 'Paste article, post or video links with optional metrics; saved on this device and exportable.', state: 'live' },
      { name: 'File import', desc: 'Load items and context datasets from a file.', state: 'live' },
      { name: 'X', desc: 'Recent posts from followed handles, through the official X API. Needs an API token; until then add posts by link.', state: 'key' },
      { name: 'Facebook / Instagram', desc: 'Recent posts from public pages and accounts, through the official Meta APIs. Needs Meta access; until then add posts by link.', state: 'vendor' },
      { name: 'Model-based tagging', desc: 'Topic, stance, claim and district tagging by a language model, to replace the rule-based tagger.', state: 'next' }
    ],

    params: [
      ['Source', ['Channel', 'Outlet / handle', 'Language', 'Media type', 'Prominence', 'Pickup (outlets)']],
      ['Who', ['Speaker type', 'Speaker', 'Entities mentioned', 'Mentions CM']],
      ['Where', ['District', 'Constituency']],
      ['What', ['Topic', 'Scheme', 'Issue / concern', 'Narrative cluster', 'Hashtags']],
      ['Stance', ['Stance on CM / govt', 'Sentiment score', 'Emotion', 'Intent', 'Tag confidence']],
      ['Traction', ['Likes', 'Shares', 'Comments', 'Views', 'Traction score']],
      ['Memory', ['Episode ID', 'Recurrence family', 'Precedent count', 'Resurfacing flag']],
      ['Quality', ['Misinformation risk', 'Urgency']]
    ]
  };
})(typeof window !== 'undefined' ? window : globalThis);


