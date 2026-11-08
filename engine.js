/* Mitä nyt? v2 — deterministic safety engine on the official SimSet schema.
 * analyze(case) → features; decide → playbook; answer() → submission object; step() → multi-turn protocol.
 * Untrusted content (the forwarded message) is only ever used as evidence; text addressed to
 * assistants inside it is stripped and treated as a scam signal. */
(function (root) {
  const isNode = typeof module !== 'undefined' && module.exports;
  const { S, STEP_OF, HANDOFF } = isNode ? require('./steps.js') : root.DSA_STEPS;
  const { P, W, Q } = isNode ? require('./playbooks.js') : root.DSA_PB;

  const fold = t => (t || '').toLowerCase().replace(/[äâ]/g, 'a').replace(/[öô]/g, 'o').replace(/å/g, 'a').replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
  const INJECTION = /(\[[^\]]*(teko[aä]ly|ai[- ]assist|assistant|avustaj|assistenten|automaattiset avustajat|automated assistants)[^\]]*\]|(SYSTEM|J[aä]rjestelm[aä]viesti|Systemmeddelande)\s*:[^\n]*|\((Turvallisuustarkastus|Security check|S[aä]kerhetskontroll)[^)]*\)|(Till AI-assistenten|Note to AI|Huom\. teko[aä]ly)[^\n]*)/gi;

  const OFFICIAL_DOMAIN = /^https?:\/\/(www\.)?operator\.(example|test|invalid|example\.net|example\.com)\//i;


  // ---- What the user (or the person they help) already DID. In free text this matters more than the scam type.
  const NEG_BEFORE = /(\bnot|n't|\b(havent|hasnt|didnt|dont|wasnt|cant|cannot)|\bnever|\bno|\bnobody|\ben|\bei|\benka|\bkukaan|\binte|\baldrig|\bingen)\s+(\S+\s+){0,3}$/;
  const REQ_BEFORE = /(asked (me |her |him |us )?to|asking (me |her |him |us )?to|asks (me |her |him |us )?to|wanted (me |her |him )?to|told (me|her|him) to|tried to (get|make)|pyysi|pyys|pyytaa|halusi|kehotti|bad (mig|henne|honom) (att )?|ville att (jag|hon|han)|ber mig|pitaisi|pitaa|ska jag)\s+(\S+\s+){0,3}$/;
  function did(text, rx) {
    let pos = false, neg = false;
    for (const cl of text.split(/[.!?;\n]+|,\s*(?:but|mutta|men|mut)\s+|\s(?:but|mutta|men|mut)\s/)) {
      const m = rx.exec(cl); if (!m) continue;
      const pre = cl.slice(0, m.index);
      if (REQ_BEFORE.test(pre)) continue;
      if (NEG_BEFORE.test(pre)) neg = true; else pos = true;
    }
    return pos ? true : neg ? false : null;
  }
  const ACT_RX = {
    paid: /(\bpaid\b|\b(i|we|she|he|they|mom|mother|dad) (already )?(transferred|wired)|transferred (\d|the money|money|it)|\bwired\b|\bi sent \d|olen (jo )?maksanut|(olen|oon|olemme|ollaan)( [a-z]+){0,2} (maksanut|maksaneet|lahettanyt|lahettaneet|siirtanyt|siirtaneet)|maksanut (jo )?huijari|olen (jo )?lahettanyt|lahettanyt (hanelle |yhteensa |jo )?\d|i'?ve (already )?(sent|paid|transferred)|already (sent|paid|transferred)|have (sent|paid|transferred) (\d|money|the money|it)|har (redan )?(betalat|overfort|skickat)|overfort|puuttuu rahaa|tililta puuttuu|rahaa (on )?(kadonnut|havinnyt|lahtenyt)|money (is )?missing|pengar (saknas|har forsvunnit)|sent (the |her |him |them )?(\d+ ?(e|eur|euro|€)|money)|she (already )?transferred|invested|maksoin|maksettiin|maksoi\b|siirsin (rahaa|rahat|\d|sinne|hanelle|tilille)|siirsi (rahaa|rahat|\d|tilille)|siirtanyt (rahaa|\d)|laitoin (sinne )?\d|laittanut (sinne )?\d|olen laittanut|lahetin (hanelle )?\d|sijoitin|betalade|betalat\b|overforde|skickade \d|skickade pengar|skickade koderna|swishade|investerade)/,
    card: /(\b(typed|entered|put|gave|filled|inserted|laitoin|syotin|annoin|kirjoitin|taytin|fyllde i|skrev in|gav|angav|lade in)\b[^.]{0,40}(card|cvv|kortin|kortti|korttin|kortnummer|kortuppgift|kortet)|(card number|card details|cvv|kortin tiedot|kortin numero|korttitied|kortnummer|kortuppgift)[^.]{0,60}(typed|entered|gave|filled|annoin|syotin|laitoin|skrev|gav|fyllde))/,
    bank: /((pankkitunnu|verkkopankkitunnu|tunnusluvu|tunnusluku|mobiiliavai|bank (codes|id|login|credentials)|banking (codes|details|password)|online bank(ing)? (codes|details|password)|mobile key|bankkod|bank-?id|nätbank|natbank)[^.]{0,40}(typed|entered|gave|used|laitoin|syotin|annoin|kirjoitin|kaytin|skrev|gav|anvande)|(laitoin|syotin|annoin|antanut|antoi|annettu|kirjoitin|typed|entered|gave|given|logged in with|kirjauduin|skrev in|loggade in med|gav|lamnat)[^.]{0,30}(pankkitunnu|tunnusluvu|tunnusluku|mobiiliavai|mobiilivarmen|mobile key|bank codes|bank id|banking codes|online banking|bankkod|bank-?id)|(mobile key|mobiiliavai)[^.]{0,20}(approval|hyvaksyn)|hyvaksyin[^.]{0,30}(mobiiliavai|pankkisovellu)|approved[^.]{0,30}bank app|godkande[^.]{0,30}bankapp|logged into my (online )?bank|kirjauduin (verkko)?pankkiin|loggade in pa banken)/,
    remote: /((anydesk|teamviewer|quick ?support|remote (access|desktop|app|program)|etayhte|etakay|ta over datorn|tog over datorn|fjarr)[^.]{0,60}(let|install|gave|allowed|asensin|annoin|annoimme|annettiin|sallin|sallimme|lat|installerade|had me|connected|ohjasi|ottivat|vi gav|vi lat)|(let|had me install|installed|asensin|annoin|lat|installerade|allowed)[^.]{0,40}(anydesk|teamviewer|remote|etayhte|fjarr)|took over my (computer|laptop|pc)|controlled my computer|ohjasi konetta|tog over datorn|ta over datorn)/,
    installed: /(installed|downloaded|asensin|latasin|installerade|laddade ner|loaded)[^.]{0,50}(app|apk|sovellu|ohjelm|profile|profiili|certificate|varmen|certifikat|program|fil)/,
    password: /(\b(typed|entered|put|gave|kirjoitin|kirjotin|syotin|laitoin|skrev in|skrev|angav|logged in|kirjauduin|loggade in)\b[^.]{0,60}(password|salasan|losenord|gmail|outlook|office ?365|microsoft|facebook|instagram|email|sahkopost|mejl|e-post|hotmail|yahoo)|(password|salasan|losenord)[^.]{0,30}(typed|entered|kirjoitin|syotin|skrev))/,
    code: /(\b(gave|sent|read|shared|told|forwarded|annoin|lahetin|luin|kerroin|sanoin|gav|skickade|laste|delade|berattade)\b[^.]{0,40}(code|koodi|\bkod\b|koden)|(code|koodi|koden)[^.]{0,40}\b(gave|sent|annoin|lahetin|luin|gav|skickade)\b)/,
    approved: /(painoin yhen|painoin yhden|hyvaksyin (yhden|yhen|sen|pyynnon)|approved (one|it|the request)|godkande (en|den))/,
    lost: /(ei paase|ei paa\b|can'?t get into|cant get into|cannot get into|locked out|password (was |has been )?changed|en paase|en paa\b|kommer inte in|hacked|hakkeroitu|hakkeroi|kaapattu|kaapat|murrettu|kapat|hackat|friends say|kaverit (sano|sai)|ystavat sai|vanner (fick|sager)|my whatsapp says|logged me out|kirjas mut ulos)/,
    nosignal: /(no signal|no service|lost signal|sim (not available|invalid|ogiltigt|ei toimi)|ingen tackning|ei kenttaa|ei oo kenttaa|ei verkkoa|hatapuhelut|emergency calls only|inget sim|sim ogiltigt|sim-kortti ei toimi)/,
    self: /(it was me|was me\b|olin itse|se olin mina|det var jag|my colleague (ordered|did)|colleague ordered|kollega(ni)? tilas|toimistopaallikko oli tilannu|oli tilannu ne ite|i ordered|tilasin|bestallde (jag|sjalv)|on holiday|lomalla|i'?m actually in|as usual|som vanligt|samma summa|niinku aina|kuten aina|kirjauduin just|just logged in|i'?m logging in|loggade in precis|precis nar jag sjalv|(moved|siirsin|flyttade) (the |my |mitt )?esim|vaihdoin (puhelimen|puhelinta)|changed (my )?phone|bytte telefon)/,
    nothing: /(didn'?t (click|type|enter|give|pay|do|open|read|answer|call)|did not|nobody (clicked|opened)|i said no|hung up|en (klikannut|syottanyt|antanut|maksanut|kirjottanu|kirjoittanut|tehnyt|avannut|vastannut|soittanut|lukenut)|ei kukaan|stangde direkt|skrev inget|gav den inte|la pa|lade pa|har inte (gjort|bestallt|klickat|betalat|oppnat|ringt|gett)|klickade inte|suljin heti|hasn'?t opened|hasnt opened|haven'?t (done|clicked|paid))/,
    unsure: /(not sure|don'?t know if|idk|can'?t remember|cant remember|maybe typed|en tiia|en tieda|en muista|en oo varma|en ole varma|vet inte om|osaker|kanske)/,
    symptoms: /(acting (weird|strange)|behaves strangely|slow|hidas|akku|battery|batteriet|konstig|outo(sti)?|weird)/,
    bankctx: /(\bbank|pankki|pankin|pankista|banken|nordea|\bop\b|op:n|osuuspankki|danske|aktia|s-pankki|handelsbanken|mobiiliavai|mobile key)/,
    opctx: /(\bdna\b|operator|operaattori|operatoren|liittym|\bsim\b|esim|abonnemang)/,
  };
  const LOSS = /(huijari|huijau|huijattiin|scam|bedrag|lurad|lost (all|my|money)|menetin|vei rahat|puuttuu rahaa|money (is )?missing|pengar (saknas|forsvunnit)|stole|varast)/;
  function acts(text) { const o = {}; for (const k in ACT_RX) o[k] = did(text, ACT_RX[k]); if (LOSS.test(text)) o.self = false;
    if (!o.remote && /(etayhte|etakay|etatuki|remote|fjarr|anydesk|teamviewer|ohjata (konet|tietokonet))/.test(text) && /(annoimme|annoin|annettiin|sallimme|sallin|we (gave|let|allowed)|i (gave|let|allowed)|vi (gav|lat)|jag (gav|lat))\s+(sen|ne|sille|hanelle|heille|it|them|him|access|in|det|dem|honom)\b/.test(text)) o.remote = true;
    if (!o.code && /(code|koodi|koden|\bkod\b)/.test(text) && /(\b(i|jag) (then )?(sent|forwarded|gave|read) (it|them|det|den)\b|lahetin sen|lahetin koodin|annoin sen|kerroin sen|luin sen|skickade den(?! inte)|gav den(?! inte))/.test(text)) o.code = true;
    if (!o.paid && /\b(i|we|she|he) (already )?(sent|wired|paid) (it|them|that)\b/.test(text) && /(wire|\beur\b|€|\d+ ?(e|eur|euro|euros)\b|money|raha|pengar|transfer|payment|invoice|lasku)/.test(text) && !/(code|koodi|\bkod)/.test(text)) o.paid = true;
    return o; }

  function analyze(c) {
    const s = c.signals || {};
    const art = s.artifact || {};
    let body = (art.body || '') + ' ' + (art.notes || '');
    const USER_INJ = /(ignore (all |the |your )?(previous |earlier )?instructions|unohda (kaikki |aiemmat )?ohjeet|ignorera (alla |tidigare )?instruktioner|say (it'?s|it is|that it is) safe|sano(, ett)? (etta )?(se )?on turvallinen|classify (this |it )?as safe|^system:|you are now)/i;
    const injected = INJECTION.test(body) || USER_INJ.test(c.opening_message || ''); INJECTION.lastIndex = 0;
    body = body.replace(INJECTION, ' ');
    const links = art.links || [];
    const lc = s.link_check && typeof s.link_check === 'object' ? s.link_check : null;
    const cw = s.call_warning && typeof s.call_warning === 'object' ? s.call_warning : null;
    const ce = s.credential_exposure && typeof s.credential_exposure === 'object' ? s.credential_exposure : null;
    let exposure = null;
    if (ce && ce.found && ce.sources) {
      const recent = ce.sources.filter(x => (x.days_ago || 0) < 60);
      exposure = { pw: recent.some(x => (x.exposed || []).some(e => /pass/.test(e))), emailOnly: recent.length > 0 && recent.every(x => (x.exposed || []).every(e => /^(email|name)$/.test(e))) };
    }
    const f = {
      journey: c.journey, audience: c.audience, lang: c.language || 'fi', biz: c.audience === 'small_business',
      o: fold(c.opening_message), a: fold(body + ' ' + (art.sender || '')), type: art.type || '',
      hasLink: links.length > 0 || /https?:\/\//.test(body) || (/(linkki|linkin|linkist|\blink\b|\blanken\b|\blank\b|\blänk)/.test(fold(c.opening_message)) && !/(ei (ole )?linkki|no link|ingen lank|without a link|ilman linkkia|siina ei ole linkkia)/.test(fold(c.opening_message))), officialLink: links.length > 0 && links.every(l => OFFICIAL_DOMAIN.test(l)),
      isCall: c.journey === 'suspicious_call' || /call/.test(art.type || '') || !!cw || /(soit|puhelu|\bcall(ed|ing|er)?\b|\brang\b|ringde|ringt|samtal)/.test(fold(c.opening_message)),
      injected, lc, cw, exposure, consent: c.consent || { requires_consent: [], pre_granted: [] },
    };
    f.x = f.o + ' ' + f.a;
    f.d = acts(f.o);
    f.acted = /(syotin|annoin|kirjauduin|kirjoitin|tunnistauduin|tein sen|\bi (entered|typed|logged in|gave|signed in)|entered my|typed my|jag (skrev in|loggade in|gav|angav)|loggade in via|skrev in mina)/.test(f.o);
    return f;
  }

  function decide(f) {
    for (const p of P) {
      try { if (p.when(f) && (!p.guard || p.guard(f))) return p; } catch (e) { /* never crash on odd input */ }
    }
    return P[P.length - 1];
  }

  // --- conditional sentences for decisive questions (single-turn: give the step that is safe if the riskier answer is true)
  const COND = {
    sim_swap: { yes: { fi: 'Jos et itse siirtänyt eSIMiä ota heti yhteyttä asiakaspalveluumme ja pyydä lukitsemaan liittymä.', en: 'If you did not move the eSIM yourself contact our customer service now and ask us to lock your number.', sv: 'Om du inte själv flyttade eSIM:et kontakta vår kundtjänst nu och be oss spärra ditt nummer.' },
      no: { fi: 'Jos siirsit sen itse uuteen puhelimeen tämä on odotettavaa, eikä mitään tarvitse tehdä.', en: 'If you moved it to a new phone yourself this is expected and you don’t need to do anything.', sv: 'Om du flyttade det själv är det väntat och du behöver inte göra något.' } },
    unknown_login: { yes: { fi: 'Jos se et ollut sinä vaihda salasana heti ja kirjaa muut laitteet ulos tilin asetuksista.', en: 'If it was not you change your password now and sign out other devices in the account settings.', sv: 'Om det inte var du byt lösenordet nu och logga ut okända enheter.' },
      no: { fi: 'Jos kirjauduit itse matkalla tarkista vain viimeaikaiset kirjautumiset.', en: 'If you logged in yourself while travelling just check the recent logins to make sure they are all yours.', sv: 'Om det var du själv på resa räcker det att logga ut okända enheter om du ser några.' } },
    attachment: { yes: { fi: 'Jos painoit salli sisältö irrota kone verkosta ja tarkistuta se asiantuntijalla.', en: 'If you clicked enable content disconnect the computer from the internet and have it checked by a specialist.', sv: 'Om du klickade på tillåt innehåll koppla bort datorn från internet och låt en expert kontrollera den.' },
      no: { fi: 'Jos näit vain tiedoston nimen älä avaa liitteen asiakirjaa äläkä salli sisältöä.', en: 'If you only saw the file list do not open the attachment or enable content in it.', sv: 'Om du bara såg filnamnet öppna inte bilagan.' } },
    ceo_fraud: { yes: { fi: 'Jos maksu on jo lähtenyt ota heti yhteyttä pankkiin ja pyydä pysäyttämään se.', en: 'If the payment has already gone contact your bank now and ask them to stop it.', sv: 'Om betalningen redan har gått kontakta banken nu och be dem stoppa den.' },
      no: { fi: 'Jos et ole vielä maksanut älä maksa ja varmista pyyntö soittamalla tuttuun numeroon.', en: 'If you have not paid yet hold the payment and check the request by calling the person on a number you already know.', sv: 'Om du inte har betalat än betala inte och ring personen på ett nummer du redan känner till.' } },
    sim_order: { yes: { fi: 'Jos kukaan ei tilannut niitä ota heti yhteyttä yritysasiakaspalveluumme ja vaihda pääkäyttäjän salasana.', en: 'If nobody in the company ordered them contact our business customer service now and change the admin account password.', sv: 'Om ingen beställde dem kontakta vår kundtjänst nu och byt lösenordet till administratörskontot.' },
      no: { fi: 'Jos kollega tilasi ne voit korjata noutopisteen ottamalla yhteyttä asiakaspalveluumme.', en: 'If a colleague ordered them you can contact our customer service to fix the pickup point.', sv: 'Om en kollega beställde dem kan du kontakta kundtjänst för att ändra hämtstället.' } },
    remote_access: { yes: { fi: 'Jos kirjauduit verkkopankkiin istunnon aikana tai sen jälkeen ota heti yhteyttä pankkiisi.', en: 'If you logged in to your online bank during or after the session contact your bank now.', sv: 'Om du loggade in på banken under eller efter sessionen kontakta din bank nu.' }, no: null },
    clicked_card_link: { yes: { fi: 'Jos syötit korttitietosi sivulle soita heti pankkiisi ja pyydä sulkemaan kortti.', en: 'If you typed your card details on the page call your bank now and ask them to block the card.', sv: 'Om du skrev in dina kortuppgifter ring din bank nu och be dem spärra kortet.' },
      no: { fi: 'Jos et syöttänyt mitään voit vain poistaa viestin.', en: 'If you did not type anything you can simply delete the message.', sv: 'Om du inte skrev in något kan du bara radera meddelandet.' } },
    bank_impostor_call: { yes: { fi: 'Jos luit koodeja soittajalle ota heti yhteyttä pankkiisi kortin takana olevasta numerosta.', en: 'If you read out any codes contact your bank now through the number on your card.', sv: 'Om du läste upp koder kontakta din bank nu via numret på kortet.' },
      no: { fi: 'Jos et antanut mitään tarkista tilisi pankin omasta sovelluksesta.', en: 'If you gave nothing check your account in the bank’s own app.', sv: 'Om du inte gav något kontrollera kontot i bankens egna app.' } },
    operator_code_call: { yes: { fi: 'Jos luit koodin soittajalle ota heti yhteyttä asiakaspalveluumme ja pyydä lukitsemaan liittymä.', en: 'If you read out the code contact our customer service now and ask us to lock your number.', sv: 'Om du läste upp koden kontakta vår kundtjänst nu och be oss spärra ditt nummer.' },
      no: { fi: 'Jos et lukenut koodia älä kerro koodia kenellekään.', en: 'If you did not read it out never share that code with anyone.', sv: 'Om du inte läste upp den dela aldrig koden med någon.' } },
  };
  // The "risky" answer to each decisive topic: for self_initiated the risky answer is "no".
  const RISKY_IS_YES = { self_initiated: false };

  const sent = (key, lang) => (S[key] || W[key] || {})[lang] || (S[key] || W[key] || {}).en || '';
  const stepIds = keys => [...new Set(keys.flatMap(k => STEP_OF[k] || [k]))];

  function compose(spec, f, lang, opts) {
    const parts = [];
    const steps = spec.s.map(k => sent(k, lang));
    parts.push(...steps.slice(0, 2));
    parts.push(sent(spec.w, lang));
    if (f.injected) parts.push(W.injection[lang]);
    parts.push(...steps.slice(2));
    for (const k of spec.o || []) parts.push(sent(k, lang));
    if (spec.e) parts.push(HANDOFF[spec.e][lang]);
    let txt = parts.filter(Boolean).join(' ');
    if (txt.split(/\s+/).length < 26) txt += ' ' + CLOSE[lang];
    return txt;
  }
  const CLOSE = { fi: 'Jos tilanne muuttuu tai saat lisää viestejä, kysy minulta uudelleen.', en: 'If anything changes or you get more messages, ask me again.', sv: 'Om något ändras eller du får fler meddelanden, fråga mig igen.' };

  function viewOf(spec, f, lang) {
    return { steps: [...spec.s, ...(spec.o || [])].map(k => sent(k, lang)).filter(Boolean), why: sent(spec.w, lang), injected: f.injected ? W.injection[lang] : null, handoff: spec.e ? HANDOFF[spec.e][lang] : null };
  }
  function viewTwin(p, f, lang) {
    const cond = COND[p.id] || {}; const riskySpec = RISKY_IS_YES[p.tw.topic] === false ? p.tw.no : p.tw.yes;
    const steps = []; if (p.id === 'remote_access') steps.push(sent('disconnect_device', lang), sent('remove_app_or_profile', lang));
    if (cond.yes) steps.push(cond.yes[lang]); if (cond.no) steps.push(cond.no[lang]);
    return { steps, why: sent(riskySpec.w, lang), injected: f.injected ? W.injection[lang] : null, handoff: p.tw.st.e ? HANDOFF[p.tw.st.e][lang] : null };
  }
  function composeTwinSingle(p, f, lang) {
    const t = p.tw, cond = COND[p.id] || {};
    const parts = [];
    if (p.id === 'remote_access') { parts.push(sent('disconnect_device', lang), sent('remove_app_or_profile', lang)); }
    if (cond.yes) parts.push(cond.yes[lang]);
    if (cond.no) parts.push(cond.no[lang]);
    const riskyWhy = (RISKY_IS_YES[t.topic] === false ? t.no : t.yes).w;
    parts.push(sent(riskyWhy, lang));
    if (f.injected) parts.push(W.injection[lang]);
    parts.push(Q[t.topic][lang]);
    if (t.st.e) parts.push(HANDOFF[t.st.e][lang]);
    return parts.filter(Boolean).join(' ');
  }

  const CONF = { spec: 0.9, twin: 0.65, fallback: 0.4, unseen: 0.75 };
  const UNSEEN = /^(number_porting|voice_clone|wangiri|router|domain_invoice|marketplace|qr_fine|profile_installed|invest_call|popup_scareware|identity_theft|generic_|self_benign|file_not_opened|lure_no_relation|clicked_unsure|mistaken_payment|police_safe_attempt|biz_|crisis|off_topic)/;
  const confOf = p => p.fallback ? CONF.fallback : UNSEEN.test(p.id) ? CONF.unseen : CONF.spec;

  function baseAnswer(c, f, p) {
    const req = new Set(f.consent.requires_consent || []);
    const pre = new Set(f.consent.pre_granted || []);
    const nec = (p.nec || []).filter(x => req.has(x));
    const art = (c.signals || {}).artifact; const visible = (art && (art.body || art.notes)) ? ['artifact'] : [];
    if (f.lc) visible.push('link_check');
    if (f.cw) visible.push('call_warning');
    return { case_id: c.case_id, nec, pre, visible };
  }

  // Single-turn answer (no conversation): ask decisive question inside the answer, act safely for the riskier branch.
  function answer(c) {
    const f = analyze(c), p = decide(f), lang = f.lang;
    const b = baseAnswer(c, f, p);
    let out;
    const known = p.tw ? textAnswer(p.tw.topic, f.o) : null;
    if (known) {
      const spec = branchFor(p, known);
      const out2 = { case_id: c.case_id, risk_level: spec.r, primary_action: spec.a, advice_text: compose(spec, f, lang), escalation_required: !!spec.e, escalation_target: spec.e || null, urgency: spec.u, steps: [], questions_asked: [], question_topics: [], confidence: CONF.spec,
        signals_used: [...b.visible, ...b.nec], consent_requested_for: b.nec.filter(x => !b.pre.has(x)), citations: p.c || [], abstained: false, _playbook: p.id + ':' + known, _view: viewOf(spec, f, lang) };
      return out2;
    }
    if (p.tw) {
      const st = p.tw.st, riskySpec = RISKY_IS_YES[p.tw.topic] === false ? p.tw.no : p.tw.yes, safeSpec = RISKY_IS_YES[p.tw.topic] === false ? p.tw.yes : p.tw.no;
      out = { risk_level: st.r, primary_action: st.a, advice_text: composeTwinSingle(p, f, lang), escalation_required: !!st.e, escalation_target: st.e || null,
        urgency: riskySpec.u, steps: [], questions_asked: [Q[p.tw.topic][lang]], question_topics: [p.tw.topic], confidence: CONF.twin,
        _steps_ids: stepIds([...riskySpec.s, ...safeSpec.s]), _view: viewTwin(p, f, lang) };
    } else {
      out = { risk_level: p.r, primary_action: p.a, advice_text: compose(p, f, lang), escalation_required: !!p.e, escalation_target: p.e || null, urgency: p.u,
        steps: [], questions_asked: p.ask ? [Q[p.ask][lang]] : [], question_topics: p.ask ? [p.ask] : [], confidence: confOf(p),
        _steps_ids: stepIds(p.s), _view: viewOf(p, f, lang) };
      if (p.ask) out.advice_text += ' ' + Q[p.ask][lang];
    }
    out.case_id = c.case_id;
    out.signals_used = [...b.visible, ...b.nec];
    out.consent_requested_for = b.nec.filter(x => !b.pre.has(x));
    out.citations = p.c || [];
    out.abstained = !!p.fallback && p.a === 'escalate_to_human';
    out._playbook = p.id;
    return out;
  }

  // ---- multi-turn ----------------------------------------------------------
  const NEG = /\b(no|not|didn'?t|haven'?t|hadn'?t|nothing|nobody|neither|never)\b|n't\b|\b(en|ei|enka|eika|emme|hankaan|kukaan|mitaan)\b|\b(nej|inte|ingen|inget|ingenting)\b/;
  const UNSURE = /(en ole varma|en osaa sanoa|en tieda|not sure|don'?t know|osaker|vet inte|ruutu oli)/;
  const YES = {
    app_installed: /(salli sisalt|enable content|painoin|clicked it|tillat|klickade pa)/,
    credentials_entered: /(and i did|ja tein sen|kirjauduin|logged in to my|loggade in pa|syotin|typed)/,
    code_shared: /(\bread (him|her|them|the code)|\bluin\b|lasin upp|laste upp koden innan|gave (him|her|them)|annoin (hanelle|koodin)|\bantoi\b)/,
    card_details_entered: /(syotin|typed|skrev in (kort|mina)|^(joo|yes|ja)\b)/,
    payment_status: /(already paid|maksoin|betalade|maksettu|paid it)/,
    self_initiated: /(myself|\bitse\b|sjalv|osakkaani sanoi|partner just told|ordered them for|olen itse|i'?m on holiday|lomalla)/,
    user_safety: /(not in danger|en ole .{0,10}vaarassa|turvassa|inte i fara|safe)/,
  };
  const TEXT_YES = {
    app_installed: /(salli (sisallon|sisalto|makro)|sallin makro|enabled (macros|content)|enable content and|tillat makro)/,
    code_shared: /(\bannoin (koodi|tunnuslu)|\bantoi (koodi|tunnuslu|\w+ tunnuslu)|\bluin (koodi|hanelle)|i (gave|read out) (him |her |them )?(the )?codes?|gav (honom |henne |dem )?koden)/,
    card_details_entered: /(syotin (korttini|kortin)|annoin kortin|typed (my|in my) card|entered my card|skrev in (mina )?kort)/,
    credentials_entered: /(kirjauduin verkkopankkiin|logged in to my (online )?bank|loggade in pa banken)/,
    payment_status: /(maksoin (sen|jo)|already paid|on jo maksettu|betalade redan|har redan betalat|maksettiin|i sent it|we paid|vi betalade)/,
    self_initiated: /(i did it myself|did that myself|siirsin (sen |esimin )?it|colleague (ordered|did)|kollega(ni)? tilas|osakkaani|on holiday|lomalla|i'?m actually in|it was me|det var jag)/,
  };
  const TEXT_NO = {
    self_initiated: /(wasn'?t (me|us|mine|ours)|was not (me|us)|ei ollut (mina|me|meidan)|inte (jag|vi)\b|not (me|us|mine)\b|never been|i'?ve never|en ole kaynyt|har aldrig varit|i'?m (at )?home|olen kotona|ar hemma|didn'?t do that|did not do that|en tehnyt sita|nobody (here )?(has )?ordered|kukaan ei (ole )?tilannut|ingen (har )?bestallt|en ole tilannut|i (didn'?t|did not|never) (order|ask)|en ole pyytanyt|en ole matkoilla|i'?m not travelling|har inte begart|inte varit)/,
    payment_status: /(en ole (vielä |viela )?maksanut|not paid yet|haven'?t paid|har inte betalat)/,
    code_shared: /(en antanut|didn'?t give|did not give|gav inte|gav den inte|en kertonut|en lukenut|said no|sa nej|hung up|la pa|lade pa)/,
    card_details_entered: /(en syottanyt|didn'?t (type|enter)|did not (type|enter)|haven'?t (typed|entered)|hasn'?t clicked|hasnt clicked|has not clicked|didn'?t click|did not click|not clicked|ei ole klikannut|har inte klickat|skrev inte in|skrev inget|typed nothing|nothing typed|en ole klikannut|en klikannut|klickade inte|nobody clicked|ei kukaan klikannut|ingen klickade|suljin heti|stangde direkt|closed (it )?(right away|immediately)|en kirjottanu|en kirjoittanut)/,
    credentials_entered: /(didn'?t log ?in|did not log ?in|haven'?t logged|har inte loggat in|en kirjautunut|en ole kirjautunut)/,
  };
  function textAnswer(topic, o) { if (TEXT_YES[topic] && TEXT_YES[topic].test(o)) return 'yes'; if (TEXT_NO[topic] && TEXT_NO[topic].test(o)) return 'no'; return null; }
  function branchFor(p, ans) { const riskyIsYes = RISKY_IS_YES[p.tw.topic] !== false; return ((ans === 'yes') === riskyIsYes) ? (riskyIsYes ? p.tw.yes : p.tw.no) : (riskyIsYes ? p.tw.no : p.tw.yes); }
  function classify(topic, text) {
    const t = fold(text);
    const m = YES[topic] && YES[topic].exec(t);
    if (m && !/\b(not|didn'?t|never|en|ei|inte|aldrig)\s+(\S+\s+)?$/.test(t.slice(Math.max(0, m.index - 25), m.index))) return 'yes';
    if (UNSURE.test(t)) return 'unsure';
    if (NEG.test(t)) return 'no';
    return 'unsure';
  }

  function finalFromSpec(c, f, p, spec, st) {
    const lang = f.lang, b = baseAnswer(c, f, p);
    const used = [...b.visible, ...b.nec.filter(x => st.granted.has(x) || b.pre.has(x))];
    return { case_id: c.case_id, risk_level: spec.r, primary_action: spec.a, advice_text: compose(spec, f, lang), escalation_required: !!spec.e, escalation_target: spec.e || null,
      urgency: spec.u, steps: [], questions_asked: st.questions.map(q => q.text), question_topics: st.questions.map(q => q.topic), signals_used: used,
      consent_requested_for: st.consentAsked, citations: p.c || [], confidence: confOf(p), abstained: false, _view: viewOf(spec, f, lang), _playbook: p.id };
  }

  const CONSENT_TEXT = {
    fi: 'Saanko katsoa nämä tiedot? Käytän niitä vain tähän kysymykseen: ', en: 'May I look at this information? I will only use it for this question: ', sv: 'Får jag titta på den här informationen? Jag använder den bara för den här frågan: ' };
  const SIGNAL_NAME = {
    'subscription.recent_events': { fi: 'liittymäsi viimeaikaiset SIM- ja tilausmuutokset', en: 'recent SIM and order changes on your subscription', sv: 'senaste SIM- och beställningsändringar på abonnemanget' },
    'operator_account.recent_logins': { fi: 'Oma-tilisi viimeaikaiset kirjautumiset', en: 'recent logins to your account with us', sv: 'senaste inloggningar till ditt konto' },
    'device.recent_app_installs': { fi: 'puhelimeen äskettäin asennetut sovellukset', en: 'apps recently installed on your phone', sv: 'appar som nyligen installerats' },
    'device.security_findings': { fi: 'tietoturvasovelluksen havainnot laitteesta', en: 'the security app’s findings on your device', sv: 'säkerhetsappens fynd på enheten' },
    'business.staff_accounts': { fi: 'yrityksenne käyttäjätilit ja niiden viimeisin käyttö', en: 'your company’s user accounts and their last activity', sv: 'företagets användarkonton och senaste aktivitet' },
  };

  // step(event, state) — sim/run_conversation.py protocol
  function step(ev, state) {
    if (ev.type === 'start') {
      Object.assign(state, { c: ev.case, f: analyze(ev.case), questions: [], consentAsked: [], granted: new Set(), refused: new Set(), answers: {}, phase: 'consent' });
      state.p = decide(state.f);
      if (state.p.tw) { const k = textAnswer(state.p.tw.topic, state.f.o); if (k) state.answers[state.p.tw.topic] = k; }
    } else if (ev.type === 'consent_reply') {
      (ev.granted || []).forEach(x => state.granted.add(x)); (ev.refused || []).forEach(x => state.refused.add(x));
    } else if (ev.type === 'user_reply' && state.lastTopic) {
      state.answers[state.lastTopic] = classify(state.lastTopic, ev.text || '');
    }
    const { c, f, p } = state, lang = f.lang;
    const forceFinal = ev.type === 'turn_limit';
    // 1) consent for the one or two signals that matter, said plainly
    if (!forceFinal && p.ask === 'user_safety' && !('user_safety' in state.answers)) {
      state.lastTopic = 'user_safety'; const q0 = { text: Q.user_safety[lang], topic: 'user_safety' }; state.questions.push(q0);
      return { type: 'question', text: q0.text, topics: ['user_safety'] };
    }
    if (!forceFinal && state.phase === 'consent') {
      state.phase = 'ask';
      const b = baseAnswer(c, f, p);
      const need = b.nec.filter(x => !b.pre.has(x));
      if (need.length) {
        state.consentAsked = need;
        return { type: 'consent_request', fields: need, text: CONSENT_TEXT[lang] + need.map(x => SIGNAL_NAME[x] ? SIGNAL_NAME[x][lang] : x).join(', ') + '.' };
      }
    }
    // 2) the decisive question, one topic at a time
    const topic = p.tw ? p.tw.topic : p.ask;
    if (!forceFinal && topic && !(topic in state.answers)) {
      state.lastTopic = topic;
      const q = { text: Q[topic][lang], topic };
      state.questions.push(q);
      return { type: 'question', text: q.text, topics: [topic] };
    }
    // 3) final answer for the branch the user is actually in
    let spec = p;
    if (p.tw) {
      const ans = state.answers[p.tw.topic];
      const riskyIsYes = RISKY_IS_YES[p.tw.topic] !== false;
      if (ans === 'unsure') { const rs = RISKY_IS_YES[p.tw.topic] === false ? p.tw.no : p.tw.yes; const fa = finalFromSpec(c, f, p, Object.assign({}, rs, { s: [rs.s[0], 'unsure_assume', ...rs.s.slice(1)] }), state); fa.confidence = CONF.twin; return { type: 'final', answer: fa }; }
      if (ans === undefined) { const a = answer(c); a.questions_asked = state.questions.map(q => q.text); a.question_topics = state.questions.map(q => q.topic); a.consent_requested_for = state.consentAsked; a.signals_used = a.signals_used.filter(x => !(f.consent.requires_consent || []).includes(x) || state.granted.has(x) || (f.consent.pre_granted || []).includes(x)); return { type: 'final', answer: a }; }
      spec = ((ans === 'yes') === riskyIsYes) ? (riskyIsYes ? p.tw.yes : p.tw.no) : (riskyIsYes ? p.tw.no : p.tw.yes);
    }
    if (p.ask === 'user_safety' && state.answers.user_safety && state.answers.user_safety !== 'yes') spec = Object.assign({}, spec, { r: 'critical', u: 'immediate', s: ['danger_112', ...spec.s] });
    return { type: 'final', answer: finalFromSpec(c, f, p, spec, state) };
  }


  // Build a case from free text typed by a person (live demo / app entry without a shared message)
  function detectLang(t) {
    const w = (t.toLowerCase().match(/[a-zäöå']+/g) || []);
    const S = { fi: /^(ja|ei|on|että|se|jos|tai|kun|minä|mitä|tämä|sain|mutta|nyt|minun|mun|pitääkö|soitti|tuli|en|oli|hän|teen|onko|mulle|mä|joku)$/, sv: /^(och|är|att|det|du|jag|inte|om|på|ett|som|med|för|har|kan|fick|vad|min|mitt|någon|ska)$/, en: /^(the|and|is|to|you|my|it|if|or|not|do|this|that|of|a|in|i|got|what|was|someone|me)$/ };
    const sc = { fi: 0, sv: 0, en: 0 }; for (const l in S) sc[l] = w.filter(x => S[l].test(x)).length;
    sc.fi += 0.5 * w.filter(x => x.length > 4 && /(ssa|ssä|sta|stä|lla|llä|lta|ltä|nut|nyt|ksi|ani|ään|kin|ko|kö)$/.test(x)).length + 0.3 * (t.match(/[äö]/gi) || []).length;
    sc.sv += 0.6 * (t.match(/å/gi) || []).length;
    let b = 'en', n = 0; for (const l of ['en', 'fi', 'sv']) if (sc[l] > n) { n = sc[l]; b = l; } return b;
  }
  function fromText(text, audience) {
    const t = fold(text);
    const journey = audience === 'small_business' ? 'smb_incident' : /(soit|puhelu|\bcall|\brang\b|ringde|ringt|samtal)/.test(t) ? 'suspicious_call'
      : /(asensin|latasin|syotin|klikkasin|klikkas|painoin|avasin|annoin|laitoin|installed|downloaded|clicked|typed|entered|installerade|laddade ner|klickade|skrev in)/.test(t) ? 'clicked_link'
      : /(salasan|password|losenord|kirjautu|login|log in|esim|\bsim\b|kentta|signal|vuo|leak|breach|hakker|hacked)/.test(t) ? 'breach_notice' : 'suspicious_message';
    return { case_id: 'LIVE-' + Date.now().toString(36), journey, audience: audience || 'consumer', language: detectLang(text), opening_message: text,
      signals: { artifact: { type: 'user_report', body: '', links: (text.match(/https?:\/\/\S+/g) || []) }, link_check: null, call_warning: null },
      consent: { requires_consent: ['subscription.recent_events', 'operator_account.recent_logins', 'device.recent_app_installs', 'device.security_findings', 'business.staff_accounts'], pre_granted: [] } };
  }

  const API = { analyze, decide, answer, step, classify, fold, fromText, detectLang };
  if (isNode) module.exports = API; else root.DSA = API;
})(typeof window !== 'undefined' ? window : globalThis);
