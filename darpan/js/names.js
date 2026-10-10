/* Jan Darpan · names of public figures, so mentions can be counted for everyone and not only the top leaders.
   Each row: [English name, Hindi spellings (regex source, | separated), distinctive?]. Names that are not distinctive are
   counted only when a title (MLA, minister, MP, mayor, president) sits next to them, which avoids matching other people
   who share a common name. Roles and seats come from the MLA roster. */
(function (g) {
  const CGP = g.CGP, R = CGP.ref;
  const N = [
    ['Renuka Singh', 'रेणुका\\s*सिंह', 0], ['Shyam Bihari Jaiswal', 'श्याम\\s*बिहारी\\s*जायसवाल|श्यामबिहारी\\s*जायसवाल', 1], ['Bhaiyalal Rajwade', 'भैयालाल\\s*राजवाड़े', 1],
    ['Bhulan Singh Marabi', 'भूलन\\s*सिंह\\s*मरावी', 1], ['Laxmi Rajwade', 'लक्ष्मी\\s*राजवाड़े', 1], ['Shakuntala Singh Portey', 'शकुंतला\\s*(सिंह\\s*)?पोर्ते|शकुन्तला\\s*(सिंह\\s*)?पोर्ते', 1],
    ['Ramvichar Netam', 'रामविचार\\s*नेताम|राम\\s*विचार\\s*नेताम', 1], ['Uddheshwari Paikra', 'उद्देश्वरी\\s*पैकरा|उद्धेश्वरी\\s*पैकरा', 1], ['Prabodh Minz', 'प्रबोध\\s*मिंज', 1],
    ['Rajesh Agrawal', 'राजेश\\s*अग्रवाल', 0], ['Ramkumar Toppo', 'राम\\s*कुमार\\s*टोप्पो|रामकुमार\\s*टोप्पो', 1], ['Raymuni Bhagat', 'रायमुनी\\s*भगत', 1],
    ['Gomati Sai', 'गोमती\\s*साय', 1], ['Vidyawati Sidar', 'विद्यावती\\s*सिदार', 1], ['O. P. Choudhary', 'ओ\\.?\\s*पी\\.?\\s*चौधरी|ओपी\\s*चौधरी', 1],
    ['Uttari Ganpat Jangde', 'उत्तरी\\s*(गणपत\\s*)?जांगड़े', 1], ['Umesh Patel', 'उमेश\\s*पटेल', 0], ['Laljeet Singh Rathia', 'लालजीत\\s*(सिंह\\s*)?राठिया', 1],
    ['Phool Singh Rathiya', 'फूल\\s*सिंह\\s*राठिया', 1], ['Lakhan Lal Dewangan', 'लखन\\s*लाल\\s*देवांगन|लखनलाल\\s*देवांगन', 1], ['Premchand Patel', 'प्रेमचंद\\s*पटेल|प्रेम\\s*चंद\\s*पटेल', 0],
    ['Tuleshwar Markam', 'तुलेश्वर\\s*(सिंह\\s*)?मरकाम', 1], ['Pranav Kumar Marpachi', 'प्रणव\\s*(कुमार\\s*)?मरपच्ची', 1], ['Atal Shrivastava', 'अटल\\s*श्रीवास्तव', 1],
    ['Punnulal Mohle', 'पुन्नूलाल\\s*मोहले', 1], ['Dharmjeet Singh Thakur', 'धर्मजीत\\s*सिंह', 0], ['Dharamlal Kaushik', 'धरमलाल\\s*कौशिक|धर्मलाल\\s*कौशिक', 1],
    ['Amar Agrawal', 'अमर\\s*अग्रवाल', 0], ['Sushant Shukla', 'सुशांत\\s*शुक्ला', 0], ['Dilip Lahariya', 'दिलीप\\s*लहरिया', 1], ['Raghavendra Kumar Singh', 'राघवेंद्र\\s*(कुमार\\s*)?सिंह|राघवेन्द्र\\s*सिंह', 0],
    ['Vyas Kashyap', 'व्यास\\s*कश्यप', 1], ['Ram Kumar Yadav', 'राम\\s*कुमार\\s*यादव|रामकुमार\\s*यादव', 0], ['Baleshwar Sahu', 'बालेश्वर\\s*साहू', 1], ['Sheshraj Harvansh', 'शेषराज\\s*हरवंश', 1],
    ['Chaturi Nand', 'चातुरी\\s*नंद', 1], ['Sampat Agrawal', 'संपत\\s*अग्रवाल', 0], ['Dwarikadhish Yadav', 'द्वारिकाधीश\\s*यादव', 1], ['Yogeshwar Raju Sinha', 'योगेश्वर\\s*(राजू\\s*)?सिन्हा', 1],
    ['Kavita Pran Lahrey', 'कविता\\s*(प्राण\\s*)?लहरे', 1], ['Sandeep Sahu', 'संदीप\\s*साहू', 0], ['Tank Ram Verma', 'टंक\\s*राम\\s*वर्मा|टंकराम\\s*वर्मा', 1], ['Inder Kumar Sao', 'इंद्र\\s*कुमार\\s*साव|इन्द्र\\s*कुमार\\s*साव', 0],
    ['Anuj Sharma', 'अनुज\\s*शर्मा', 0], ['Motilal Sahu', 'मोतीलाल\\s*साहू', 0], ['Rajesh Munat', 'राजेश\\s*मूणत|राजेश\\s*मुणत', 1], ['Purandar Mishra', 'पुरंदर\\s*मिश्रा', 1],
    ['Sunil Kumar Soni', 'सुनील\\s*(कुमार\\s*)?सोनी', 0], ['Guru Khushwant Saheb', 'गुरु\\s*खुशवंत\\s*साहेब|खुशवंत\\s*साहेब', 1], ['Indra Kumar Sahu', 'इंद्र\\s*कुमार\\s*साहू|इंद्रकुमार\\s*साहू', 0],
    ['Rohit Sahu', 'रोहित\\s*साहू', 0], ['Janak Dhruw', 'जनक\\s*ध्रुव', 1], ['Ambika Markam', 'अंबिका\\s*मरकाम', 1], ['Ajay Chandrakar', 'अजय\\s*चंद्राकर', 1],
    ['Onkar Sahu', 'ओंकार\\s*साहू', 0], ['Sangeeta Sinha', 'संगीता\\s*सिन्हा', 0], ['Anila Bhendiya', 'अनिला\\s*भेंडिया', 1], ['Kunwer Singh Nishad', 'कुंवर\\s*(सिंह\\s*)?निषाद', 1],
    ['Lalit Chandrakar', 'ललित\\s*चंद्राकर', 1], ['Gajendra Yadav', 'गजेंद्र\\s*यादव', 0], ['Devendra Yadav', 'देवेंद्र\\s*यादव', 0], ['Rikesh Sen', 'रिकेश\\s*सेन', 1],
    ['Domanlal Korsewada', 'डोमन\\s*लाल\\s*कोर्सेवाड़ा|डोमनलाल\\s*कोर्सेवाड़ा', 1], ['Ishwar Sahu', 'ईश्वर\\s*साहू', 0], ['Dipesh Sahu', 'दीपेश\\s*साहू', 0], ['Dayaldas Baghel', 'दयाल\\s*दास\\s*बघेल|दयालदास\\s*बघेल', 1],
    ['Bhawna Bohra', 'भावना\\s*बोहरा', 1], ['Yashoda Verma', 'यशोदा\\s*वर्मा', 0], ['Harshita Swami Baghel', 'हर्षिता\\s*(स्वामी\\s*)?बघेल', 1], ['Raman Singh', 'रमन\\s*सिंह', 0],
    ['Daleshwar Sahu', 'दलेश्वर\\s*साहू', 1], ['Bholaram Sahu', 'भोलाराम\\s*साहू', 1], ['Indrashah Mandavi', 'इंद्रशाह\\s*मंडावी', 1], ['Vikram Usendi', 'विक्रम\\s*उसेंडी', 1],
    ['Savitri Manoj Mandavi', 'सावित्री\\s*(मनोज\\s*)?मंडावी', 1], ['Asharam Netam', 'आशाराम\\s*नेताम', 1], ['Neelkanth Tekam', 'नीलकंठ\\s*टेकाम', 1], ['Lata Usendi', 'लता\\s*उसेंडी', 1],
    ['Kedar Nath Kashyap', 'केदार\\s*(नाथ\\s*)?कश्यप', 1], ['Lakheshwar Baghel', 'लखेश्वर\\s*बघेल', 1], ['Kiran Singh Deo', 'किरण\\s*(सिंह\\s*)?देव|किरण\\s*सिंहदेव', 1], ['Vinayak Goyal', 'विनायक\\s*गोयल', 1],
    ['Chaitram Atami', 'चैतराम\\s*अटामी', 1], ['Vikram Mandavi', 'विक्रम\\s*मंडावी', 1], ['Kawasi Lakhma', 'कवासी\\s*लखमा', 1]
  ];
  // Public figures who are not sitting MLAs but are in the news often.
  const X = [
    ['Narendra Modi', 'नरेंद्र\\s*मोदी|पीएम\\s*मोदी|प्रधानमंत्री\\s*मोदी', 'Prime Minister', 'BJP', 'bjp', 1],
    ['Amit Shah', 'अमित\\s*शाह|गृह\\s*मंत्री\\s*शाह', 'Union Home Minister', 'BJP', 'bjp', 1],
    ['Mohan Bhagwat', 'मोहन\\s*भागवत|डॉ\\.?\\s*भागवत', 'RSS Sarsanghchalak', 'RSS', 'bjp', 1],
    ['Rahul Gandhi', 'राहुल\\s*गांधी', 'Congress leader', 'INC', 'opp', 1],
    ['Mallikarjun Kharge', 'मल्लिकार्जुन\\s*खरगे|खरगे', 'Congress president', 'INC', 'opp', 1],
    ['Tarun Chugh', 'तरुण\\s*चुघ', 'BJP national office in-charge', 'BJP', 'bjp', 1],
    ['Ramen Deka', 'रमेन\\s*डेका', 'Governor', '', 'govt', 1],
    ['Mohan Charan Majhi', 'मोहन\\s*(चरण\\s*)?माझी|मोहन\\s*(चरण\\s*)?मांझी|माझी', 'Chief Minister of Odisha', 'BJP', 'bjp', 0],
    ['Brijmohan Agrawal', 'बृजमोहन\\s*अग्रवाल', 'MP, Raipur', 'BJP', 'bjp', 1],
    ['Santosh Pandey', 'संतोष\\s*पांडेय|संतोष\\s*पाण्डेय', 'MP, Rajnandgaon', 'BJP', 'bjp', 1],
    ['Vijay Baghel', 'विजय\\s*बघेल', 'MP, Durg', 'BJP', 'bjp', 1],
    ['Saroj Pandey', 'सरोज\\s*पांडेय|सरोज\\s*पाण्डेय', 'MP, Rajya Sabha', 'BJP', 'bjp', 1]
  ];
  const TITLES = 'विधायक|विधायिका|मंत्री|मंत्री|सांसद|महापौर|अध्यक्ष|उपाध्यक्ष|विधानसभा|नेता|पूर्व|उपमुख्यमंत्री|मुख्यमंत्री|प्रवक्ता|प्रत्याशी|MLA|MP|minister';
  const mk = (hi, uniq) => new RegExp(uniq ? hi : '(?:' + TITLES + ')[^\\n।]{0,45}(?:' + hi + ')|(?:' + hi + ')[^\\n।]{0,25}(?:' + TITLES + ')', 'i');
  const list = [];
  const mlas = CGP.mlas || {};
  const byName = {}; Object.keys(mlas).forEach(k => (byName[mlas[k].name] = mlas[k]));
  N.forEach(r => {
    const m = byName[r[0]]; if (!m) return;
    const en = new RegExp('\\b' + r[0].replace(/[.]/g, '\\.?').replace(/\s+/g, '\\s+') + '\\b', 'i');
    list.push({ name: r[0], role: m.role ? m.role.split(';')[0] : 'MLA, ' + m.constituency, party: m.party, group: m.party === 'BJP' ? 'bjp' : 'opp', rx: mk(r[1], r[2]), en });
  });
  X.forEach(r => list.push({ name: r[0], role: r[2], party: r[3], group: r[4], rx: mk(r[1], r[5]), en: new RegExp('\\b' + r[0].replace(/\s+/g, '\\s+') + '\\b', 'i') }));
  R.people = list;
  R.leaders.forEach(l => { if (!list.some(p => p.name === l.name)) list.push({ name: l.name, role: l.role, party: l.party, group: l.group, rx: new RegExp(l.kw, 'i'), en: new RegExp(l.kw, 'i') }); });
})(typeof window !== 'undefined' ? window : globalThis);
