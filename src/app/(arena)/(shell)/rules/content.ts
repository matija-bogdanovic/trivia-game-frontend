/**
 * ===========================================================================
 * rules/content.ts — how the game is played, in both languages
 * ===========================================================================
 *
 * NOT in i18n.tsx, on purpose. That file is a flat map of short interface
 * strings — labels, buttons, one-line messages — and it is looked up a key at
 * a time. This is long-form prose in ordered sections, and putting sixty
 * paragraph keys through the same map would bury the interface strings among
 * them and still leave the ORDER of the page encoded in the component rather
 * than in the text.
 *
 * ── EVERY NUMBER HERE IS THE ENGINE'S ──────────────────────────────────────
 * The figures below are not illustrative: they are read off
 * lambda-ws/lib/config.mjs, and each one is marked with the constant it comes
 * from so the two can be checked against each other. A rules page that quietly
 * drifts from the rules is worse than no rules page, because it is believed.
 */

export interface RuleBlock {
  /** a paragraph */
  text?: string;
  /** a list of points, each already a full sentence */
  points?: string[];
  /** a worked example, set apart from the prose */
  example?: { title: string; lines: string[] };
}

export interface RuleSection {
  /** a stable id, so a section can be linked to */
  id: string;
  title: string;
  /** one line under the heading, the section in a breath */
  lead: string;
  blocks: RuleBlock[];
}

export interface RulesContent {
  title: string;
  intro: string;
  /** the quick figures strip at the top */
  facts: { label: string; value: string }[];
  sections: RuleSection[];
}

/* ─────────────────────────────────────────────────────────── SERBIAN ───── */

const SR: RulesContent = {
  title: 'Kako se igra',
  intro:
    'Ipak se okreće je kviz na ispadanje. Svi počinju sa istim novcem, pogrešni odgovori i izgubljene opklade ga odnose, a ko ostane bez ičega — ispada. Pobeđuje poslednji koji stoji.',
  facts: [
    { label: 'Igrača', value: '2–6' },
    { label: 'Početni novac', value: '500–2500' },
    { label: 'Pogrešan odgovor', value: '−100' },
    { label: 'Najmanja opklada', value: '10' },
  ],
  sections: [
    {
      id: 'cilj',
      title: 'Cilj',
      lead: 'Ostati poslednji za stolom.',
      blocks: [
        {
          text: 'Domaćin bira sa koliko novca se kreće — između 500 i 2500, svi isto. Od tog trenutka novac samo menja vlasnika: ništa se ne stvara ni iz čega i ništa ne nestaje. Ono što neko izgubi, neko drugi dobije, a ono što niko ne osvoji ostaje u kasi za sledeće runde.',
        },
        {
          text: 'Kad ti novac padne na nulu, ispadaš. Partija se završava kad ostane samo jedan igrač — i on uzima sve što je preostalo u kasi.',
        },
      ],
    },
    {
      id: 'runda',
      title: 'Tok runde',
      lead: 'Točak bira, jedan odgovara, ostali se klade.',
      blocks: [
        {
          points: [
            'Točak se okreće i bira ko odgovara. Ko je nedavno bio na redu ima manju šansu da odmah opet dođe na red, ali nikad ne postane nemoguć.',
            'Izabrani dobija pitanje sa četiri ponuđena odgovora. Vremena je 15 sekundi na početku, i skraćuje se za sekundu sa svakim nastavkom lanca, najmanje 8 sekundi.',
            'Svi ostali živi igrači se u međuvremenu klade na to da li će on pogoditi. Knjiga je otvorena od trenutka kad se pitanje pojavi.',
            'Kad odgovori — ili kad mu istekne vreme — ostaje još 8 sekundi pauze za klađenje. Pauza se prekida ranije čim se svi izjasne.',
            'Otkriva se tačan odgovor, opklade se isplaćuju, i vidi se ko je koliko dobio ili izgubio.',
          ],
        },
        {
          text: 'Ako je odgovorio tačno, on bira ko ide sledeći — i na koji način. Ako je pogrešio, plaća 100 i točak se okreće ponovo iz početka.',
        },
      ],
    },
    {
      id: 'kladjenje',
      title: 'Klađenje',
      lead: 'Kvota je obećanje, ne procena.',
      blocks: [
        {
          text: 'Dok neko odgovara, ti se kladiš na ishod: TAČNO ili NETAČNO. Najmanji ulog je 10, a najveći je sve što imaš. Ulog odmah izlazi iz tvog novčanika i ulazi u kasu, tako da se isti novac ne može uložiti dvaput.',
        },
        {
          text: 'Kvota se računa iz tačnosti igrača koji odgovara — koliko je pitanja pogodio u OVOJ partiji, ne u istoriji. Kreće se između 1.10 i 2.00, i zaključava se u trenutku kad se opklada primi. Kasnije se ne menja, jer bi u trenutku isplate njegova statistika već sadržala baš onaj ishod koji se isplaćuje.',
        },
        {
          example: {
            title: 'Primer',
            lines: [
              'Igrač koji odgovara je do sada pogodio pola pitanja → obe kvote su 2.00.',
              'Uložiš 100 na NETAČNO. Novčanik ti odmah pada za 100.',
              'On pogreši. Dobijaš 100 × 2.00 = 200 nazad.',
              'Krajnji rezultat: 100 više nego pre opklade — ulog udvostručen.',
            ],
          },
        },
        {
          text: 'Kvota 2.00 je gornja granica i znači tačno duplo. Ako se kladiš na ishod koji je verovatniji, plaća manje: na igrača koji pogađa 80% pitanja, opklada na TAČNO nosi 1.25 — od 100 dobiješ 125. To je cela poenta cene. Iznos koji ćeš dobiti piše na dugmetu pre nego što se odlučiš.',
        },
        {
          text: 'Dobitna opklada se uvek isplaćuje u punom iznosu. Ako kasa u tom trenutku nema dovoljno, razlika se doplaćuje i kasa ide u minus — sledeći izgubljeni ulozi je vraćaju. Ono što piše na dugmetu je ono što stiže u novčanik.',
        },
        {
          text: 'Možeš i da preskočiš rundu. „Preskoči" je punopravna odluka: ništa ne ulažeš, ali se pauza završava čim se svi izjasne, pa preskakanje ubrzava igru umesto da je čeka.',
        },
      ],
    },
    {
      id: 'izbor',
      title: 'Kad pogodiš: ti biraš',
      lead: 'Koga, i na koji način.',
      blocks: [
        {
          text: 'Tačan odgovor ti daje pravo da izabereš sledećeg — imaš 20 sekundi. Pitanje koje šalješ je teže od uobičajenog, jer je izbor napad, a ne usluga. Biraš i način:',
        },
        {
          points: [
            'IZAZOV — izabrani odgovara sam, a ti možeš da podržiš ishod svojim novcem. Cena se računa iz NJEGOVE tačnosti, ne tvoje.',
            'DVOBOJ — obojica trčite na isto pitanje, obojica ulažete isti ulog.',
          ],
        },
        {
          text: 'Ulog u izazovu se uplaćuje naslepo: pitanje se izvlači u istom trenutku kad i ulog, tako da ga niko nije video — ni ti. Ostali za stolom gledaju izazov, ne klade se na njega; njihova knjiga radi samo na pitanjima koja je dodelio točak.',
        },
        {
          text: 'Ako ne izabereš na vreme, izbor pada nasumično, kao izazov, i bez uloga. Niko ti ne može uložiti novac na opkladu koju nisi napravio.',
        },
      ],
    },
    {
      id: 'dvoboj',
      title: 'Dvoboj',
      lead: 'Isto pitanje, dva igrača, meri se stotinka.',
      blocks: [
        {
          text: 'U dvoboju obojica ulažete po 100. Ako neko od vas nema toliko, ulog se spušta na ono što ima siromašniji — niko ne može biti nateran da uloži novac koji nema, i nijedan račun ne može otići u minus.',
        },
        {
          text: 'Ulog je fiksan baš zato što je dvoboj simetričan. Kad bi ga birao onaj ko poziva, bogat igrač bi mogao siromašnog da gurne na sve ili ništa u bacanju novčića koje on može da priušti a protivnik ne može. „Sve ili ništa" postoji, ali u izazovu, gde je to tvoj novac na tvoj rizik.',
        },
        {
          points: [
            'Vreme se meri od trenutka kad se pitanje pojavi, na serveru, i prikazuje se na stotinku.',
            'Prvi tačan odgovor zatvara dvoboj i nosi oba uloga.',
            'Ko odgovori brzo ali netačno, potrošio je svoj pokušaj — protivnik i dalje može da uzme sve ako pogodi pre isteka vremena.',
            'Ako niko ne pogodi, oba uloga ostaju u kasi. Dvoboj koji niko nije dobio košta obojicu.',
            'Kod potpuno istog vremena pobeđuje pozvani, ne onaj ko je pozvao.',
          ],
        },
        {
          text: 'Kazna od 100 za pogrešan odgovor se u dvoboju NE naplaćuje povrh izgubljenog uloga. Ulog jeste cena dvoboja.',
        },
        {
          text: 'Pobednik dvoboja bira sledećeg.',
        },
      ],
    },
    {
      id: 'tocak',
      title: 'Točak',
      lead: 'Slučajan, ali ne zaboravan.',
      blocks: [
        {
          text: 'Točak ne bira ravnomerno. Svako nosi težinu koja se smanjuje kad ga izvuče i polako vraća dok ga preskače. Zato se retko dešava da isti igrač odgovara tri puta zaredom — a i dalje je moguće, jer se težina nikad ne spušta na nulu. Isto tako, neko koga dugo nije bilo ne postaje sigurna stvar.',
        },
      ],
    },
    {
      id: 'kraj',
      title: 'Kraj partije',
      lead: 'Poslednji uzima sve.',
      blocks: [
        {
          text: 'Kad ostane samo jedan igrač sa novcem, partija se završava i sve što je ostalo u kasi ide njemu. To je prenos, ne poklon: ukupan zbir je isti kao na početku, samo je sad u jednim rukama.',
        },
        {
          text: 'Na konačnoj tabeli preživeli idu ispred ispalih, veći iznos ispred manjeg, a među ispalima ide ispred onaj ko je duže izdržao.',
        },
        {
          text: 'Za odigranu partiju dobijaš 25 novčića, a za pobedu 100 novčića i 25 poena, uz dodatnih 5 poena za svaku uzastopnu pobedu — najviše 50.',
        },
      ],
    },
  ],
};

/* ─────────────────────────────────────────────────────────── ENGLISH ───── */

const EN: RulesContent = {
  title: 'How to play',
  intro:
    'Ipak se okreće is a trivia game about elimination. Everyone starts with the same money, wrong answers and lost bets take it away, and anyone who runs out is out. The last player standing wins.',
  facts: [
    { label: 'Players', value: '2–6' },
    { label: 'Starting money', value: '500–2500' },
    { label: 'Wrong answer', value: '−100' },
    { label: 'Minimum bet', value: '10' },
  ],
  sections: [
    {
      id: 'cilj',
      title: 'The goal',
      lead: 'Be the last one at the table.',
      blocks: [
        {
          text: 'The host sets the stake everyone starts on — between 500 and 2500, the same for all. From then on money only changes hands: nothing is created and nothing disappears. What one player loses another wins, and whatever nobody claims stays in the pot and funds later rounds.',
        },
        {
          text: 'Reach zero and you are eliminated. The match ends when one player is left, and they take whatever the pot still holds.',
        },
      ],
    },
    {
      id: 'runda',
      title: 'The round',
      lead: 'The wheel picks, one answers, the rest bet.',
      blocks: [
        {
          points: [
            'The wheel spins and chooses who answers. Anyone picked recently is less likely to come up again straight away, but never impossible.',
            'They get a question with four options. Fifteen seconds to begin with, one second less for every link the chain runs on, never below eight.',
            'Everyone else still in the game bets on whether they will get it right. The book opens the moment the question appears.',
            'Once they answer — or run out of time — there are eight more seconds of betting. The pause ends early as soon as everyone has declared.',
            'The answer is revealed, bets are settled, and everyone sees what they won or lost.',
          ],
        },
        {
          text: 'A correct answer earns the right to choose who goes next, and how. A wrong one costs 100 and sends the wheel back to the start.',
        },
      ],
    },
    {
      id: 'kladjenje',
      title: 'Betting',
      lead: 'The quota is a promise, not an estimate.',
      blocks: [
        {
          text: 'While someone answers you back an outcome: RIGHT or WRONG. The smallest stake is 10 and the largest is everything you hold. The stake leaves your wallet and enters the pot immediately, so the same money cannot be staked twice.',
        },
        {
          text: "The quota comes from the answering player's accuracy in THIS match, not their history. It runs between 1.10 and 2.00 and is locked the moment the bet is accepted — never recomputed at settlement, because by then their record would already include the very outcome being paid out.",
        },
        {
          example: {
            title: 'Worked example',
            lines: [
              'The answerer has been right about half the time → both sides price at 2.00.',
              'You stake 100 on WRONG. Your wallet drops by 100 at once.',
              'They get it wrong. You receive 100 × 2.00 = 200.',
              'Net: 100 better off than before the bet — the stake doubled.',
            ],
          },
        },
        {
          text: 'A quota of 2.00 is the ceiling and means exactly double. Backing the likelier outcome pays less: against someone answering 80% correctly, a bet on RIGHT pays 1.25 — 100 returns 125. That is the whole point of a price. The figure you will receive is printed on the button before you commit.',
        },
        {
          text: 'A winning bet is always paid in full. If the pot cannot cover it, the shortfall is minted and the pot goes into deficit, which the next losing stakes repay. What the button said is what lands in the wallet.',
        },
        {
          text: 'You may also sit a round out. Sitting out is a real declaration: it stakes nothing, but the pause ends as soon as everyone has declared, so it moves the game on rather than waiting.',
        },
      ],
    },
    {
      id: 'izbor',
      title: 'Getting it right: you choose',
      lead: 'Who, and how.',
      blocks: [
        {
          text: 'A correct answer lets you pick who faces the next question — you have 20 seconds. What you send is harder than the usual draw, because picking is an act of aggression rather than a favour. You also choose the shape:',
        },
        {
          points: [
            'CHALLENGE — they answer alone, and you may back the outcome with your own money. The price comes from THEIR accuracy, not yours.',
            'DUEL — the two of you race the same question, both anteing the same amount.',
          ],
        },
        {
          text: 'A challenge stake is committed blind: the question is drawn in the same instant the money is taken, so nobody has seen it — you included. The rest of the table watches a challenge rather than betting on it; their book runs on the wheel’s questions only.',
        },
        {
          text: 'Say nothing in time and the pick is made for you: a random target, as a challenge, with no wager. Nobody can be staked on a bet they never made.',
        },
      ],
    },
    {
      id: 'dvoboj',
      title: 'The duel',
      lead: 'One question, two players, hundredths of a second.',
      blocks: [
        {
          text: 'Both duellists ante 100. If either cannot afford it the ante drops to what the poorer one holds — nobody can be made to stake money they do not have, and no balance can go negative.',
        },
        {
          text: 'The ante is fixed precisely because a duel is symmetric. If the caller sized it, a rich player could shove a poor one all-in on a coin flip they can afford to lose and their opponent cannot. All-in exists, but in a challenge, where it is your own money at your own risk.',
        },
        {
          points: [
            'Time is measured from the moment the question appears, on the server, and shown to the hundredth of a second.',
            'The first correct answer closes the duel and takes both antes.',
            'Answering fast and wrong spends your one attempt — the other can still take it by answering correctly before time runs out.',
            'If neither gets it, both antes stay in the pot. A duel nobody won costs them both.',
            'On an exact tie the defender wins, not the caller.',
          ],
        },
        {
          text: 'The usual 100 penalty for a wrong answer is NOT charged on top of a lost ante. The ante is the duel’s price.',
        },
        { text: 'The winner of a duel picks who goes next.' },
      ],
    },
    {
      id: 'tocak',
      title: 'The wheel',
      lead: 'Random, but not forgetful.',
      blocks: [
        {
          text: 'The wheel does not draw evenly. Everyone carries a weight that falls when they are picked and recovers while they are passed over. That is why the same player rarely answers three times running — and why it stays possible, because the weight never reaches zero. By the same token, someone long ignored never becomes a certainty.',
        },
      ],
    },
    {
      id: 'kraj',
      title: 'The end',
      lead: 'The last one takes it all.',
      blocks: [
        {
          text: 'When one player is left holding money the match ends and everything still in the pot goes to them. That is a transfer, not a gift: the total is the same as it was at the start, only now it is in one pair of hands.',
        },
        {
          text: 'On the final table survivors place above the eliminated, larger balances above smaller — and among the eliminated, whoever lasted longer places higher.',
        },
        {
          text: 'Playing a match earns 25 coins. Winning earns 100 coins and 25 points, plus 5 more points for every consecutive win, capped at 50.',
        },
      ],
    },
  ],
};

export function rulesFor(lang: string): RulesContent {
  return lang === 'sr' ? SR : EN;
}
