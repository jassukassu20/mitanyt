// Free-typed situations written AFTER the engine was built (not from the SimSet). Expected = set of acceptable actions.
const E = require('./engine.js');
const B='contact_bank_and_block_cards',V='verify_via_official_channel',D='do_not_interact_and_delete',O='contact_operator_support',P='change_password_and_enable_mfa',I='isolate_device_and_scan',H='escalate_to_human',N='no_action_needed',R='report_to_authority',X='decline_out_of_scope';
const T = [
 ['Mun mummolle soitettiin pankista ja hän antoi tunnuslukunsa. Mitä nyt?','consumer',[B]],
 ['Joku soitti ja väitti olevansa Nordeasta, en antanut mitään ja lopetin puhelun.','consumer',[V,D]],
 ['Sain tekstarin että paketti on jumissa tullissa, pitää maksaa 2,99e. En oo klikannut.','consumer',[D,V]],
 ['I paid 40 euros for concert tickets on Facebook and the seller blocked me. It was a scam.','consumer',[B,R]],
 ['My WhatsApp got hacked, I can\'t log in and my friends get weird messages from me.','consumer',[P,H]],
 ['Someone called from Microsoft and I let them connect to my laptop with AnyDesk.','consumer',[I,B,H]],
 ['Jag fick ett sms från banken om att mitt konto är spärrat med en länk.','consumer',[V,D]],
 ['Min telefon har ingen täckning och jag fick ett sms om att mitt eSIM aktiverats på en ny enhet.','consumer',[O,H]],
 ['Sain viestin että numeroni siirretään toiselle operaattorille, en ole pyytänyt sitä.','consumer',[O,H]],
 ['Kirjoitin sähköpostin salasanan sivulle joka näytti Outlookilta.','consumer',[P]],
 ['I downloaded an app from a text link to track my parcel and gave it permissions.','consumer',[I,H]],
 ['Got a text: Hi mum this is my new number, can you send 300 euros for rent today?','consumer',[V,D]],
 ['Soitto ulkomaisesta numerosta, hälytti kerran ja katkesi. Soitanko takaisin?','consumer',[D,V,N]],
 ['A pop-up says my computer is locked and to call Microsoft support. I didn\'t call.','consumer',[D,V]],
 ['Ex-poikaystävä tietää missä olen ja mitä viestin. Onko puhelimessa jotain?','consumer',[H,R]],
 ['Can you find out who owns the number that scammed me? I want to post it online.','consumer',[X,R]],
 ['Pankin sovellukseen tulee koko ajan hyväksyntäpyyntöjä vaikka en kirjaudu.','consumer',[P,B]],
 ['I got a parking fine letter with a QR code to pay, I don\'t remember parking there.','consumer',[V,D]],
 ['Selling my sofa online, buyer wants me to confirm the payment by entering my card on a link.','consumer',[D,V]],
 ['Grandson called crying he had an accident and needs 500 euros now, the voice sounded like him.','consumer',[V,D]],
 ['Our accountant got an email from the CEO to urgently pay 9800 euros to a new supplier.','small_business',[B,V,H]],
 ['Toimittaja ilmoitti sähköpostilla uuden tilinumeron, maksetaanko seuraava lasku sinne?','small_business',[V]],
 ['All files on our shop computer are encrypted and there is a ransom note demanding bitcoin.','small_business',[I,H]],
 ['Entinen työntekijä pääsee yhä yrityksen Instagramiin ja sähköpostiin.','small_business',[P,H]],
 ['We got an invoice for our domain renewal from a company we have never used.','small_business',[V,D]],
 ['Työntekijä avasi sähköpostin liitteen ja salli makrot, nyt kone on hidas.','small_business',[I,H]],
 ['I got an order confirmation from the operator for 3 new SIM cards that nobody here ordered.','small_business',[O,H]],
 ['Sain ilmoituksen että tilini kirjauduttiin Brasiliasta. En ole matkoilla.','consumer',[P,H]],
 ['Klikkasin linkkiä ja syötin korttini tiedot paketin toimitusmaksua varten.','consumer',[B]],
 ['My bank texted that I have a new message in the online bank, no link. Is it real?','consumer',[N,V]],
];
let ok = 0; const rows = [];
for (const [txt, aud, exp] of T) {
  const c = E.fromText(txt, aud); const a = E.answer(c);
  const pass = exp.includes(a.primary_action); ok += pass;
  rows.push((pass ? 'OK  ' : 'MISS') + ' ' + a.primary_action.padEnd(31) + a.risk_level.padEnd(9) + (a._playbook || '').padEnd(24) + txt.slice(0, 70));
}
console.log(rows.join('\n')); console.log(`\nlive free-text: ${ok}/${T.length}`);
