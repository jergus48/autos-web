(window.SWX_I18N = window.SWX_I18N || {}).lv = {
  locale: "lv-LV",
  themeLabel: ["Ieslēgt tumšo režīmu", "Ieslēgt gaišo režīmu"],

  assistantT: {
    think: ["Analizēju Jūsu problēmu…", "Meklēju piemērotākos risinājumus…", "Pārlūkoju mūsu iepriekšējos projektus…", "Sagatavoju e-pastu mūsu komandai…"],
    understood: "Šādi mēs to sapratām", offTopic: "Atbilde",
    retryHint: "Aprakstiet uzdevumu vai problēmu savā uzņēmumā, ko vēlētos vienkāršot, piemēram, kas to dara, cik daudz laika tas aizņem un kādu programmatūru izmantojat.", retry: "Aprakstīt citādi",
    kind: { agent: "MI aģents", automation: "Automatizācija", integration: "Integrācija", app: "Pielāgota lietotne" },
    cx: { simple: "Vienkārši", medium: "Vidēja sarežģītība", complex: "Sarežģīti" },
    tooShort: "Lūdzu, aprakstiet problēmu mazliet precīzāk, vismaz vienā vai divos teikumos.",
    err: { rate: "Pārāk daudz pieprasījumu pēc kārtas. Lūdzu, mēģiniet vēlreiz pēc dažām minūtēm.", off: "MI asistents īslaicīgi nav pieejams. Uzrakstiet mums zemāk vai uzreiz pierakstieties uz sarunu.", generic: "Atbilde nav saņemta. Lūdzu, mēģiniet vēlreiz." },
    needFields: "Lūdzu, ievadiet savu vārdu un derīgu e-pasta adresi un apstipriniet piekrišanu.",
    sending: "Sūta…", send: "Sūtīt e-pastu",
    sent: function (n) { return "Paldies, " + n + "! Mēs saņēmām Jūsu e-pastu un atbildēsim ar e-pastu. Ja vēlaties aprunāties ātrāk, zemāk izvēlieties sev piemērotu laiku." },
    sendOff: "Automātiskā nosūtīšana šobrīd nedarbojas. Atveriet e-pastu savā pasta programmā, tas jau ir sagatavots:",
    openMail: "Atvērt pasta programmā",
    sendErr: "Nosūtīšana neizdevās. Lūdzu, mēģiniet vēlreiz vai rakstiet tieši uz info@swiftrix.eu.",
    rateSend: "No šīs lapas tikko tika nosūtīts e-pasts. Ja vēlaties kaut ko pievienot, rakstiet tieši uz info@swiftrix.eu.",
    calFail: "Kalendāru neizdevās ielādēt.",
    notesPrefix: "No swiftrix.eu MI asistenta"
  },

  assistantCases: {
    hakom: ["Protokolu digitālā apstiprināšana", "Digitalizējām visu protokolu apstiprināšanu ražošanā. Darbinieki pieslēdzas ar uzņēmuma karti, redz katru jaunu pārskatāmo dokumentu un apstiprina to digitāli. Simtiem papīra veidlapu aizstāja pilnīga izsekojamība.", "hakom.sk"],
    aluprint: ["Protokolu digitālā apstiprināšana", "Uzņēmuma Aluprint ražošanas līnijā ieviesām to pašu apstiprināšanas sistēmu ar karti. Vadība uzreiz redz, ka visi darbinieki ir izlasījuši un apstiprinājuši spēkā esošos protokolus, un papīra dokumentu vairs nav.", "aluprint.sk"],
    gaya: ["Rēķinu arhīva sakārtošana", "Izstrādājām programmu, kas savienota ar skeneri un salīdzina katru noskenēto papīra rēķinu ar datubāzi, precīzi norādot, kurus drīkst iznīcināt. Tā atbrīvojās daudz glabātuves vietas.", "gaya.sk"],
    geosoul: ["Konstrukciju aprēķinu programmatūra", "Pielāgota lietotne, kas veic ģeotehnisko projektu konstrukciju aprēķinus un katram projektam automātiski izveido atbilstošu Word atskaiti. Tā ir saistīta ar klienta produktiem un ņem vērā dažādus enkuru veidus un grunts apstākļus.", "geosoul.sk"],
    unisport: ["Datubāzes migrācija", "Automatizējām ļoti liela vēsturiskās datubāzes pārcelšanu no vecās vietnes uz jauno, notīrot un pārkārtojot datus tā, lai katrs ieraksts nonāktu īstajā vietā.", "unisport-kovac.sk"],
    urbarlamac: ["Ikmēneša īpašumu norēķini", "Automatizācija, kas no jaunākajiem zemesgrāmatas izrakstiem sagatavo kooperatīva ikmēneša izmaksu aprēķinus tā dalībniekiem Excel formātā. Nogurdinošs manuāls darbs tagad notiek pats.", "urbarlamac.sk"],
    joinupshift: ["Klipotāju pieņemšanas un pārvaldības portāls", "Pilnīgs portāls klipotāju pārvaldībai no sākuma līdz beigām: pieņemšana un apmācība, kontu pārvaldība, automatizēti maksājumi un informācijas panelis ar katra pārdošanas apjomu, skatījumiem un apgrozījumu.", "joinupshift.com"]
  },

  calcT: {
    perMonth: "/mēn.", perYear: "/gadā", h: "h", days: "darba dienas", months: "mēn.",
    per: { day: "h dienā", week: "h nedēļā", month: "h mēnesī" }, people: "pers.",
    prefilled: "Pavadīto laiku pārņēmām no Jūsu apraksta. Ja vajag, pielāgojiet to.",
    summary: function (c, f) {
      return "Kalkulators: " + c.amount + " " + window.SWX_I18N.lv.calcT.per[c.per] + " × " + c.people + " " + window.SWX_I18N.lv.calcT.people + ", " + f.money(c.rate) + "/h → šobrīd " +
        f.money(c.costMonth) + "/mēn. (" + f.money(c.costMonth * 12) + "/gadā). Ja automatizācija pārņemtu " + c.share + " %, tiktu ietaupīti ~" +
        f.money(c.saveYear) + "/gadā un " + f.num(c.hoursFreedYear) + " h gadā" + (c.payback ? ", atmaksāšanās ~" + f.num(c.payback, 1) + " mēn." : "") + "."
    }
  },

  demoT: {
    own: "Jūsu e-pasts", ownSubj: "Ielīmējiet jebkuru e-pastu", from: "No", subject: "Temats", to: "Kam",
    run: "Palaist aģentu", rerun: "Palaist vēlreiz", working: "Aģents strādā…",
    idle: "Gaida", busy: "Darbojas", done: "Pabeigts",
    pick: "Kreisajā pusē izvēlieties e-pastu un noklikšķiniet uz “Palaist aģentu”.",
    resultIdle: "Šeit parādīsies aģenta kopsavilkums un atbildes melnraksts.",
    missing: "Trūkstošā informācija", reply: "Atbildes melnraksts", approve: "Apstiprināt un sūtīt", edit: "Labot", editing: "Labošana pabeigta",
    toast: "Demonstrācijas režīms: īstā risinājumā šī atbilde no Jūsu pasta tiktu nosūtīta klientam.",
    empty: "Tabula vēl ir tukša. Palaidiet aģentu.",
    cols: ["Nr.", "Klients", "Prece / pakalpojums", "Daudzums", "Summa", "Piegāde", "Statuss"],
    status: { ready: "Gatavs", waiting: "Trūkst datu", review: "Jāpārbauda" },
    tooShort: "E-pasts ir pārāk īss. Ielīmējiet vismaz dažus teikumus.",
    reading: "Lasa e-pastu…",
    liveNote: "Reālajā režīmā aģents nav savienots ar Jūsu katalogu, tāpēc nepārbauda ne cenas, ne atlikumus. Īstā risinājumā tas strādā ar Jūsu CRM, ERP vai Excel.",
    err: { rate: "Pārāk daudz mēģinājumu pēc kārtas. Lūdzu, mēģiniet vēlreiz pēc dažām minūtēm.", off: "Reālais režīms šobrīd ir izslēgts. Izmēģiniet e-pasta piemērus.", generic: "E-pastu neizdevās apstrādāt. Mēģiniet vēlreiz vai izvēlieties piemēru." },
    live: {
      type: { order: "E-pasts izlasīts: pasūtījums", quote: "E-pasts izlasīts: cenas pieprasījums", question: "E-pasts izlasīts: klienta jautājums", complaint: "E-pasts izlasīts: sūdzība", other: "E-pasts izlasīts: ne pasūtījums, ne pieprasījums" },
      sender: "Sūtītājs atpazīts: ", noSender: "Sūtītāja uzņēmums e-pastā nav norādīts",
      items: function (n) { return n ? (n % 10 === 1 && n % 100 !== 11 ? "Ievadīta " + n + " rinda" : (n % 10 === 0 || (n % 100 >= 11 && n % 100 <= 19) ? "Ievadītas " + n + " rindu" : "Ievadītas " + n + " rindas")) : "Preču vai pakalpojumu rindas nav atrastas" },
      missing: function (n) { return n ? (n === 1 ? "Trūkst viena datu punkta, tāpēc atbildē pievienoju jautājumu" : "Trūkst datu (" + n + " punkti), tāpēc atbildē pievienoju jautājumus") : "Visa nepieciešamā informācija ir norādīta" },
      sheet: "Ievadīts pasūtījumu tabulā", reply: "Atbilde sagatavota un gaida Jūsu apstiprinājumu"
    },
    sys: { mail: "E-pasts", crm: "CRM", stock: "Noliktava", sheet: "Pasūtījumu tabula" }
  },

  demoSamples: [
    {
      id: "build", fromName: "Jānis Kalniņš", fromEmail: "j.kalnins@buvritms.lv", time: "08:47",
      subject: "Pasūtījums Liepu ielas objektam",
      body: "Labdien!\n\nvēlamies pasūtīt šādus materiālus mūsu objektam Liepu ielā 68, Rīgā:\n- Cements CEM II/A-LL 42,5 R, 40 maisi pa 25 kg\n- Betona stiegrojums B500B Ø12, 1,2 t\n- Betona bloki 25 cm, 6 paletes\n\nPiegāde plānota 15. oktobrī līdz pulksten 10:00. Preci objektā pieņems mūsu darbu vadītājs Mārtiņš, tālr. +371 20 000 000.\nLūdzu, rēķinu izrakstiet uz SIA Būvritms.\n\nAr cieņu\nJānis Kalniņš\nIepirkumu nodaļa",
      steps: [
        ["mail", "E-pasts izlasīts: jauns pasūtījums"],
        ["crm", "Klients atrasts CRM: SIA Būvritms, rēķins uzņēmumam"],
        ["stock", "3 preces salīdzinātas ar katalogu, cenas pārbaudītas"],
        ["stock", "Atlikumi pārbaudīti: visas preces ir pieejamas"],
        ["sheet", "Pasūtījums ievadīts: 3 rindas, 2 186,00 € bez PVN"],
        ["mail", "Apstiprinājums klientam sagatavots un gaida Jūsu apstiprinājumu"]
      ],
      result: {
        summary: "Jauns pasūtījums objektam Liepu ielā 68, Rīgā: 3 preces, piegāde 15. oktobrī līdz plkst. 10:00. Visa informācija ir norādīta.",
        customer: "SIA Būvritms", status: "ready", delivery: "15. okt. līdz 10:00, Liepu iela 68",
        items: [["Cements CEM II/A-LL 42,5 R, 25 kg", "40 maisi", "248,00 €"], ["Betona stiegrojums B500B Ø12", "1,2 t", "1 068,00 €"], ["Betona bloki 25 cm", "6 pal.", "870,00 €"]],
        missing: [],
        reply: { subject: "RE: Pasūtījums Liepu ielas objektam", body: "Labdien, Jāni!\n\npaldies par pasūtījumu. Apstiprinām:\n- Cements CEM II/A-LL 42,5 R, 40 maisi: 248,00 €\n- Betona stiegrojums B500B Ø12, 1,2 t: 1 068,00 €\n- Betona bloki 25 cm, 6 paletes: 870,00 €\nKopā: 2 186,00 € bez PVN\n\nPiegādāsim 15. oktobrī līdz plkst. 10:00 uz Liepu ielu 68 Rīgā. Šoferis pirms ierašanās piezvanīs Mārtiņam.\nRēķins tiks izrakstīts uz SIA Būvritms.\n\nJauku dienu!" }
      }
    },
    {
      id: "freight", fromName: "Laura Bērziņa", fromEmail: "laura@tiribaplus.lv", time: "09:15",
      subject: "Pārvadājums uz Tallinu",
      body: "Labdien!\n\nmums nepieciešams nogādāt 4 Eiropas paletes (aptuveni 1 800 kg) no mūsu noliktavas Jelgavā uz Tallinu. Iekraušana varētu notikt nākamajā otrdienā pēcpusdienā. Krava: sadzīves ķīmijas līdzekļi, bīstamu vielu nav.\n\nKāda būtu cena un vai piegāde trešdien būtu iespējama?\n\nLaura Bērziņa\nSIA Tīrība Plus",
      steps: [
        ["mail", "E-pasts izlasīts: pārvadājuma cenas pieprasījums"],
        ["crm", "Jauns klients, kartīte izveidota: SIA Tīrība Plus"],
        ["mail", "Krava ievadīta: 4 Eiropas paletes, aptuveni 1 800 kg, bez bīstamām vielām"],
        ["mail", "Trūkst 3 datu punktu, bez kuriem cenu aprēķināt nevar"],
        ["sheet", "Pieprasījums ievadīts tabulā ar statusu “Trūkst datu”"],
        ["mail", "Atbilde ar jautājumiem sagatavota un gaida Jūsu apstiprinājumu"]
      ],
      result: {
        summary: "Cenas pieprasījums: 4 Eiropas paletes (aptuveni 1 800 kg) Jelgava → Tallina, iekraušana nākamajā otrdienā pēcpusdienā, vēlamā piegāde trešdien.",
        customer: "SIA Tīrība Plus", status: "waiting", delivery: "Iekraušana otrd., piegāde trešd.",
        items: [["Pārvadājums Jelgava → Tallina, sadzīves ķīmijas līdzekļi (bez bīstamām vielām), aptuveni 1 800 kg", "4 pal.", "-"]],
        missing: ["Precīza iekraušanas adrese Jelgavā", "Piegādes adrese Tallinā un kontaktpersona uz vietas", "Vai paletes drīkst likt vienu uz otras (un līdz kādam augstumam)"],
        reply: { subject: "RE: Pārvadājums uz Tallinu", body: "Labdien, Laura!\n\npaldies par pieprasījumu. Lai nosauktu precīzu cenu un apstiprinātu piegādi trešdien, mums vēl trūkst:\n1. Precīzas iekraušanas adreses Jelgavā.\n2. Piegādes adreses Tallinā un kontaktpersonas uz vietas.\n3. Informācijas, vai paletes drīkst likt vienu uz otras un kāds ir to augstums.\n\nTiklīdz saņemsim šo informāciju, cenu nosūtīsim stundas laikā.\n\nJauku dienu!" }
      }
    },
    {
      id: "cafe", fromName: "Anna", fromEmail: "anna@kafejnica-rits.lv", time: "10:02",
      subject: "pasūtījums",
      body: "labdien, tāpat kā iepriekšējo reizi, tikai ar divreiz vairāk kafijas 🙂 un pievienojiet 2 kastes papīra krūzīšu pa 300 ml. vai jums ir auzu piens? ja ir, tad 12 pudeles.\npiegāde kā parasti\n\nAnna, kafejnīca Rīts",
      steps: [
        ["mail", "E-pasts izlasīts: atkārtots pasūtījums"],
        ["crm", "Klients atrasts CRM: kafejnīca Rīts, Stacijas iela 10, Liepāja"],
        ["crm", "Atrasts pēdējais pasūtījums Nr. 1042: kafija 6 kg, cukura standziņas 2 kastes"],
        ["stock", "Atlikumi pārbaudīti: auzu piens ir pieejams (34 pudeles)"],
        ["sheet", "Pasūtījums ievadīts: 4 rindas, 343,80 € bez PVN"],
        ["mail", "Atbilde ar atbildi uz jautājumu sagatavota un gaida Jūsu apstiprinājumu"]
      ],
      result: {
        summary: "Atkārtots pasūtījums, kas atbilst Nr. 1042, ar divkāršotu kafijas daudzumu, papildus krūzītes un auzu piens. Parastā piegādes adrese un diena.",
        customer: "Kafejnīca Rīts", status: "ready", delivery: "Otrdiena, Stacijas iela 10",
        items: [["Kafijas pupiņas “Espresso”, 1 kg (kā Nr. 1042 × 2)", "12 gab.", "226,80 €"], ["Cukura standziņas, 1 000 gab. (kā Nr. 1042)", "2 kastes", "23,00 €"], ["Papīra krūzītes 300 ml, 1 000 gab.", "2 kastes", "64,00 €"], ["Auzu piens Barista, 1 l", "12 gab.", "30,00 €"]],
        missing: [],
        reply: { subject: "RE: pasūtījums", body: "Labdien, Anna!\n\nsaņēmām Jūsu pasūtījumu:\n- Kafija “Espresso” 1 kg: 12 gab. (divreiz vairāk nekā iepriekšējo reizi)\n- Cukura standziņas: 2 kastes\n- Papīra krūzītes 300 ml: 2 kastes\n- Auzu piens Barista 1 l: 12 gab. (jā, mums tāds ir!)\nKopā: 343,80 € bez PVN\n\nPiegādāsim kā parasti otrdien uz Stacijas ielu 10.\n\nJauku dienu!" }
      }
    }
  ],

  faq: {
    "vai man jāmaksā iepriekš par jūsu pakalpojumiem?": "Darba uzsākšanai lūdzam 30 līdz 50 % avansa maksājumu, bet atlikusī summa jāapmaksā pēc nodošanas. Darbojošās automatizācijas pēc tam tiek uzturētas par ikmēneša uzturēšanas maksu, kas ietver uzraudzību, apkopi un atbalstu.",
    "vai swiftrix derēs mazām komandām un jaunuzņēmumiem?": "Noteikti. Mazas komandas bieži gūst vislielāko labumu, jo manuāls darbs aizņem lielāku daļu viņu dienas. Katru risinājumu pielāgojam Jūsu uzņēmuma lielumam, budžetam un izmantotajiem rīkiem.",
    "ar kādiem rīkiem un platformām jūs integrējaties?": "Praktiski ar visu, kam ir API: CRM sistēmām, izklājlapām, e-pastu, Slack, datubāzēm, maksājumu sistēmām un pielāgotiem iekšējiem rīkiem. Ja tam ir saskarne, parasti to varam automatizēt.",
    "vai jūs nodarbojaties ar procesu optimizāciju vai tikai ar izstrādi?": "Abus. Sākumā izkārtojam un izanalizējam Jūsu darba procesus, lai novērstu liekus zaudējumus, un tikai tad veidojam automatizācijas. Pastāvīga optimizācija ir daļa no katra projekta.",
    "vai es varu jebkurā brīdī atteikties, ja neesmu apmierināts?": "Jā. Nekādu ilgtermiņa saistību nav. Ja mēs nesniedzam vērtību, Jūs varat sadarbību pārtraukt jebkurā laikā, lai gan lielākā daļa komandu izvēlas palikt.",
    "kas atšķir swiftrix no citiem pakalpojumu sniedzējiem?": "Mēs esam inženieri, nevis universāla aģentūra. Katra automatizācija tiek veidota īpaši Jūsu sistēmām, tiek pastāvīgi uzraudzīta un to atbalsta mūsu darbības nepārtrauktības garantija.",
    "vai jūs veidojat automatizācijas vai tikai konsultējat par stratēģiju?": "Mēs veidojam. Stratēģija ir iekļauta, taču Jūs saņemat darbojošās, ražošanai gatavas automatizācijas, nevis tikai prezentāciju ar ieteikumiem."
  },

  heroWords: ["darbplūsmas"],
  aboutLabel: "/ PAR MUMS",
  aboutWords: ["aģentūra"]
}
