# User Journey — Kaeru

| | |
|---|---|
| Status | v1.0 |
| Author | Japan travel expert |
| Date | 2026-10-05 |
| Tracking | Issue #2 |
| Facts from | `docs/research/tax-free-system-2026.md` |
| Pain points | `docs/research/traveler-pain-points.md` (`PP-nn`) |
| Primary consumer | UX design (issue #3) |

Journey steps carry IDs `UJ-001`…`UJ-0nn` so that design, domain rules and test cases can cite the same step. Rules cited as `DR-0nn` live in `docs/product/domain-rules.md`.

---

## Personas

### P1 — The Lin family (林家), zh-TW

Three people: **Lin Yi-chun** (林宜君, 38, the organiser), her husband **Lin Chih-hao** (林志豪, 40), and their daughter **Lin Shu-yi** (林書儀, 9). Three separate passports; the daughter's purchases are made on her mother's passport because a 9-year-old is not doing her own tax-free registration.

Five days in Tokyo, departing from Narita (NRT), afternoon flight. Second visit since the reform was announced; Yi-chun has read one bnext article and a Facebook post and is worried. Shopping plan: drugstores in Ueno and Shinjuku (several visits, several receipts, mostly 8%-rate food and 10% cosmetics, some of which they will definitely open in Japan), one outlet day at Gotemba (clothes and shoes, 10%, several shops), and one electronics purchase at Bic Camera.

What she cares about: not losing money through a procedural mistake, knowing what the trip actually cost, and not spending her last morning in a panic. She is on an Android phone, holds the family's passports, and has a roaming data plan that she turns off to save money.

**Shape of her data:** 10–14 receipts, 3–4 different refund operators, 2 passports, two suitcases plus carry-ons, ~¥180,000 of spending, ~¥16,000 of consumption tax at stake.

### P2 — Alex, en

Solo, 31, English-speaking, in Osaka for three days on the back of a work trip. Departing from Kansai (KIX), early morning flight. Has never done Japanese tax-free before and assumes it is like the EU: a form, a counter, a stamp.

Shopping plan: a few deliberate purchases — a ¥1,280,000 watch from a department store (tax-excluded unit price over ¥1,000,000, so serial number and possibly a certificate check), a camera lens, and some whisky and snacks as gifts.

What he cares about: not missing his 07:45 flight, and getting the watch refund right because it is ~¥128,000 of tax. He is on an iPhone, no roaming data, relies on hotel and airport Wi-Fi.

**Shape of his data:** 4–6 receipts, 2–3 operators, 1 passport, one checked bag, one high-value item that must be in his hand at the kiosk with paperwork.

---

## Stage 1 — Before the trip

| | |
|---|---|
| **Goals** | Understand that the rules changed and what that means for money and time. Set the trip up in under two minutes. |
| **Actions** | Reads a news article or a friend's warning. Installs Kaeru (PWA, no account). Reads a short explainer. Enters travelers, departure date, departure airport, flight time. |
| **Pain points** | PP-17 (old mental model: expects a till discount and a paper form), PP-07 (does not realise the tax is now a cash-flow cost), PP-10 (never heard of green/red), PP-16 (Alex does not yet know "final departure airport" is a load-bearing phrase). |

**Kaeru solution flow**

- **UJ-001 — Five-step explainer.** The new system in five screens, in the user's language, readable in 60 seconds. Lands the three counter-intuitive facts early: you pay full price now; customs happens before bag drop; one missing item kills a whole receipt. Content is drafted in `docs/content/guide.zh-TW.md` / `guide.en.md`. Skippable, re-openable from the guide.
- **UJ-002 — Trip setup, minimal.** Required: departure date, departure airport, at least one traveler. Flight time optional but it powers the airport countdown. Travelers are a display name and nothing else — Kaeru never stores a full passport number (`DR-041`). Yi-chun adds "宜君" and "志豪" and does not add her daughter, because the daughter has no receipts of her own.
- **UJ-003 — Airport buffer preference.** A single setting: how much extra time to allow for the tax-free procedure, defaulting to 60 minutes, labelled plainly as Kaeru's recommendation rather than an official figure, because no official figure exists (`DR-032`).
- **UJ-004 — Install prompt.** Offer "add to home screen" here, not at the airport. Airport Mode must already be installed and cached before it is needed (PP-19).

**Design note.** Yi-chun arrives anxious and Alex arrives unaware. The explainer has to work for both without being a wall of text — the anxious user wants reassurance that there is a procedure, the unaware user needs to be told there is a problem at all.

---

## Stage 2 — Shopping

| | |
|---|---|
| **Goals** | Capture the receipt before it goes in the bag and is never seen again. Know whether this shop even reached the threshold. |
| **Actions** | Pays the tax-inclusive price, shows a passport, takes a receipt with a QR code on it, sometimes gets told to "scan this later", sometimes gets nothing explained at all. Walks out with full hands. |
| **Pain points** | PP-04 (no idea which operator), PP-11 (threshold arithmetic in her head), PP-08 (bought snacks she will eat tonight on the same receipt as gift snacks), PP-05 (nothing is tracking any of this), PP-20 (the ¥300 refund on a small receipt may not be worth it). |

**Kaeru solution flow**

- **UJ-005 — 20-second receipt log.** Three required inputs and nothing else: **tax-excluded total**, **shop**, **traveler** (`DR-010`). Smart defaults carry the rest: date = today, rate = 10% with an 8% toggle, operator = *not set*, packing = *with me*, status = *logged*. Shop name autocompletes from previously entered shops in the trip, which matters because Yi-chun visits Matsumoto Kiyoshi three times.
  - If the user only has the tax-inclusive total, accept that instead and derive the rest, clearly labelled as an estimate (`DR-021`, `DR-022`). The threshold is legally judged on the tax-excluded figure, so the UI must never pretend a derived number is the real one.
- **UJ-006 — Mixed-rate line.** One optional second amount for a different rate on the same receipt, because a drugstore basket is routinely part 8% food and part 10% cosmetics (`DR-020`). Collapsed by default; one tap to open.
- **UJ-007 — Threshold indicator.** For the shop-and-day group, show either "qualifies" or "¥X more today at this shop" (`DR-011`, `DR-012`). This is the one place Kaeru can still change the user's behaviour, because she is standing in the shop.
- **UJ-008 — "I will use this in Japan" marker.** One tap at logging time, persisted as `willUseInJapan`. This is **future intent**, deliberately distinct from the past-tense `allItemsPresent` check in UJ-018: it is a prediction made in the shop, and its job is advice, not status. If set, Kaeru warns that this receipt will probably not be refundable and that next time these items belong in a separate transaction (`DR-018`, `DR-030`, PP-08, PP-02). It does not change the receipt's status — the traveler may still change their mind and carry the snacks home. The warning must land as advice, not scolding.
- **UJ-009 — Receipt photo.** Optional, one tap, stored on device. This is the recovery path for everything the user did not type, including the operator QR.
- **UJ-010 — Operator deferred.** "Not sure" is the default and is never an error state (PP-04). Kaeru shows a quiet "resolve tonight" item instead of blocking the save.

**Design note.** The whole interaction happens one-handed, standing, with shopping bags, possibly in a queue, possibly with a 9-year-old pulling on the other arm. Anything that needs two hands or a considered decision will not be done, and an un-logged receipt is a lost receipt.

---

## Stage 3 — Hotel, evening

| | |
|---|---|
| **Goals** | Turn a pocketful of paper into a clean list. Do the registrations she skipped. |
| **Actions** | Empties bags onto the bed, sorts receipts, scans QR codes, creates accounts on operator sites, repacks. |
| **Pain points** | PP-04 (now discovers she has met three different operators), PP-13 (uncomfortable giving passport and card data to companies she has never heard of), PP-03 (first sight of a fee), PP-05 (which of these did I already do?). |

**Kaeru solution flow**

- **UJ-011 — Tonight's list.** A short list of receipts needing something: operator not set, registration not done, amount missing. Finite and finishable — the user should be able to reach zero and put the phone down.
- **UJ-012 — Resolve the operator.** From the receipt QR or the printed name, pick from the operator directory (`docs/content/operators.md`). Kaeru does **not** register on the user's behalf and does not scrape; it links out and records that the user says it is done (`DR-050`, and the brief's non-goal).
- **UJ-013 — Registration status per operator, not per receipt.** Registration is normally once per operator, after which that operator's later receipts attach automatically. Modelling it per receipt would make Yi-chun do the same thing eleven times.
- **UJ-014 — Fee expectation.** When the operator is known and we have published fee data, show the estimated net (`DR-025`). Where we do not, say we do not. An honest "fee unknown" beats a confident wrong number, and this user may be the one from PTT who received NT$77.
- **UJ-015 — Packing location.** Per receipt: *with me* / *checked bag* / *not sure*. Set here, used in Stage 4 and 5. This is the field that converts the airport rule into an action the user can take on day two.
- **UJ-016 — Running total.** Tax paid so far, estimated net refund, number of receipts needing action. Yi-chun wants to know the trip's real cost; Alex wants to confirm the watch is being tracked.

**Design note.** This is the only stage with time, light and a table. It is where Kaeru earns the airport. It is also tired-at-22:00, so the list must be short and obviously finite.

---

## Stage 4 — Last day

| | |
|---|---|
| **Goals** | Pack so that tomorrow morning works. |
| **Actions** | Consolidates suitcases, decides what goes in checked bags, buys a last few things at the station. |
| **Pain points** | PP-01 in embryo (the mistake is made here, the consequence is felt tomorrow), PP-02 (the snacks she already ate), PP-09 (two passports, two piles), PP-15 (Alex's watch certificate is in a drawer), PP-06 (what time to leave the hotel). |

**Kaeru solution flow**

- **UJ-017 — Packing plan.** The list that matters: every receipt still expecting a refund, and where its goods are. Anything marked *checked bag* or *not sure* is raised to the top with the reason — these goods must be reachable at the airport before bag drop (`DR-030`).
- **UJ-018 — Receipt integrity check.** For each refund-expecting receipt, "do you still have everything on it?" Any *no* moves that receipt to **will not claim** with the reason recorded, so it does not create a surprise at the kiosk (`DR-034`, PP-02).
- **UJ-019 — Grouping by traveler.** Two piles, two checklists, because each passport is confirmed separately (`DR-004`, PP-09). Yi-chun needs to hand Chih-hao his own list, not read hers aloud in a queue.
- **UJ-020 — Documents reminder.** Receipts with tax-excluded unit price ≥ ¥1,000,000 get "bring the certificate / warranty" (`DR-016`, PP-15). Alex sees this the night before, not at the counter.
- **UJ-021 — Deadline check.** Two distinct findings, worded differently because they are different states. A receipt whose 90-day deadline falls **before** departure cannot be confirmed at all (`DR-076`). A receipt whose deadline falls on the departure date or within a few days after it is valid but has no margin (`DR-076a`) — that one says "this receipt's deadline is your departure day", never "this will expire". For a five-day trip both are silent, and they should be: slack is about 85 days. They exist for near-maximum stays, where equality is structural rather than coincidental — Taiwan passport holders get 90 days visa-free and 短期滞在 caps at 90, so buying on arrival day and leaving on the last permitted day lands on the boundary exactly.
  - **There is nothing to do about either at this point in the trip**, because customs confirmation only happens at departure. So this check also belongs wherever the departure date can be **changed**: someone deciding at 23:00 whether to stay two more days must see which receipts that costs before they book it, not after (`DR-076a`).
- **UJ-022 — Departure time plan.** `flightTime − trip.checkInMinutes − trip.airportBufferMinutes` = "leave for the airport by". Both terms default to 60 minutes and both are user-correctable, because airlines and airports differ. Show the arithmetic, not just the answer: a recommendation the user cannot audit is one they will ignore. Labelled as Kaeru's recommendation, because no official figure exists (`DR-032`, PP-06).

---

## Stage 5 — Airport

This is the stage the product exists for. The sequence below is the official one (`docs/research/tax-free-system-2026.md` §6), and the order is not negotiable.

| | |
|---|---|
| **Goals** | Get customs confirmation for every claimable receipt, then check in, without missing the flight. |
| **Actions** | Arrives, finds the kiosks, queues, scans a passport, reads a result, possibly goes to an inspection point, then checks in. |
| **Pain points** | PP-01, PP-02, PP-09, PP-10, PP-19, PP-06, PP-16. |

### The airport sequence, precisely

**UJ-023 — Airport Mode.** Entered from a persistent entry point on departure day. Fully offline, no network call on the critical path (PP-19). Large targets, one decision per screen, resumable if the user backgrounds the app.

The steps, in order:

1. **UJ-024 — Before you enter the terminal: everything in hand.** Every item on every claimable receipt must be physically with you — carry-on or a bag you still control. Nothing in a bag you are about to hand over. Kaeru lists any receipt still marked *checked bag* or *not sure* and refuses to advance until the user resolves each one. This is the hard gate (PP-01).
2. **UJ-025 — Find the tax-free terminals.** They are in the **international departure lobby, landside, before baggage drop** — not after security, not near the gate. Kaeru states this in words and shows the airport name from trip setup. For connecting itineraries it names the **final** departure airport (PP-16).
3. **UJ-026 — Do customs before check-in.** An explicit, unmissable state: **do not check your bags yet**. It persists across the whole of Airport Mode until step 8 clears it. If the user tries to mark check-in done early, Kaeru explains what they are about to lose (PP-01).
4. **UJ-027 — Per-traveler checklist.** Switch to one traveler. Their claimable receipts, each with shop, amount, operator, and "all items present?". Tick through. A receipt that cannot be ticked is moved to *will not claim* with a reason, before reaching the kiosk, not at it (PP-02, PP-09).
5. **UJ-028 — At the kiosk: present the passport.** Reading the passport to a result takes a few seconds. Kaeru shows what to expect and, for the seven airports where it applies (Narita, Haneda, Kansai, Chubu, Fukuoka, New Chitose, Naha), notes that Visit Japan Web is an alternative inside the departure-lobby procedure Wi-Fi area, before security — presented as an option, not instructions we have not seen (`DR-033`).
6. **UJ-029 — Read the result.**
   - **Green** — no inspection. Customs confirmation is complete. Mark the traveler done.
   - **Red** — go to the customs inspection point and show the goods. Kaeru's red screen is calm and specific: this is a routing decision, not an accusation; here is what to show; keep everything together; the per-receipt rule still applies. It must not read like an error state (PP-10).
7. **UJ-030 — Consumed or missing goods.** If a receipt's goods were consumed in Japan, the official instruction is **not** to use the kiosk for it but to tell a customs officer at the counter. Kaeru routes the user there rather than letting them try the machine (`DR-035`, PP-08).
8. **UJ-031 — Confirmation done → release the gate.** Only after every traveler is marked done does Kaeru clear the "do not check your bags yet" state and say: now check in and drop your bags.
9. **UJ-032 — Time awareness throughout.** A quiet countdown to the "leave for check-in" time derived in UJ-022. If it runs short, Kaeru says the honest thing: abandoning an inspection half-way counts as no confirmation, and missing a flight over a refund is not compensated (`DR-032`). The user, not the app, decides what to drop.

### What happens on a red result, in full

The user is sent to the customs inspection point and asked to present the tax-free goods for the receipts being checked. The decisive rule is `DR-030`/`DR-034`: confirmation is per single purchase transaction, so if one item on a checked receipt is not present, that entire receipt is rejected — including the items that are present. There is no partial refund of a receipt. If the goods were already checked in, they cannot be retrieved and the refund for those receipts is simply lost.

Kaeru cannot fix a red result. What it can do is make sure that by the time a red result happens, every item is in the user's hands and every doomed receipt has already been taken off the list — so a red result is an inconvenience rather than a loss.

---

## Stage 6 — Back home

| | |
|---|---|
| **Goals** | Confirm the money actually arrived, and learn what the trip really cost. |
| **Actions** | Checks a card statement or bank account days or weeks later. Possibly chases an operator. |
| **Pain points** | PP-12 (no timing standard, so "late" is undefinable), PP-03 (the fee shock lands here), PP-14 (which card did I point this at?). |

**Kaeru solution flow**

- **UJ-033 — Refund tracker.** Per receipt: status, operator, expected net, days since customs confirmation. Grouped by operator, because that is how the money actually arrives and how the user will chase it.
- **UJ-034 — Record what arrived.** One field: amount received. Kaeru then shows expected vs actual and the implied fee. Over time this is how the operator fee data in `DR-051` gets corrected by reality rather than by our guesses.
- **UJ-035 — Overdue nudge.** After a user-configurable period with no money, surface the operator's contact link and the facts needed to chase: purchase date, shop, amount, confirmation date (`DR-036`). Kaeru does not contact anyone on the user's behalf.
- **UJ-036 — Trip summary.** Tax paid, confirmed, received, lost, and why anything was lost. The honest version. This is also the screen that teaches the user how to shop better next time, which is the only real fix for PP-02 and PP-08.
- **UJ-037 — Export / delete.** The user can take their data out and can wipe it. No server ever had it.

---

## Cross-cutting — receipts from the old system

Not a stage: this can appear at any point from Stage 2 onwards, and it will be most common in exactly the launch cohort — anyone whose trip straddles 2026-10-31 / 11-01.

- **UJ-038 — Old-system receipts.** A receipt with a purchase date on or before **2026-10-31** followed the old system: the tax was already deducted at the till and there is nothing to do at the airport (`DR-001`, `DR-003`, `DR-064`, PP-18). Kaeru detects this from the purchase date alone and says so plainly on the receipt, excludes it from every airport checklist, and still counts it towards trip spend so the user's cost picture stays whole. This needs its own visible explanation rather than silent exclusion: a receipt that quietly does nothing at the airport looks like the app lost it, and a traveler holding two kinds of receipt in one trip has no way to tell them apart otherwise.

---

## Two walkthroughs

### P1 — Yi-chun, Narita, 15:20 departure

Day 1, Ueno, 19:40. ¥6,480 tax-excluded at a drugstore, three taps, operator unknown, marked *with me*. The snacks for tonight went through a second, separate transaction after UJ-008 warned her on day 1 — a behaviour change Kaeru caused, worth roughly one receipt's refund.

Day 3, Gotemba. Four receipts across three shops, two of which turn out to share an operator. One ¥4,100 receipt shows "¥900 more at this shop today"; she buys a second pair of socks and crosses the threshold. That is the threshold indicator earning its place.

Day 3, 22:15, hotel. Tonight's list has six items. She resolves three operators from receipt QRs, registers with two (the third she already did on day 1), and marks packing: the outlet clothes go in the checked bag, everything else stays with her. Kaeru's total: ¥14,900 tax, estimated net ¥14,100.

Day 5, 09:00, packing. UJ-017 raises five receipts marked *checked bag*. She moves those goods into a carry-on bag instead — this is the moment PP-01 is actually prevented, two hours before the airport. UJ-018 catches one receipt whose face masks were opened and used; it moves to *will not claim*, ¥280 written off knowingly rather than discovered at a kiosk.

Day 5, 11:30, Narita Terminal 1, landside. Airport Mode. The gate holds: two receipts are still *not sure*; she finds both items in the daughter's backpack and ticks them. Two traveler checklists, hers and Chih-hao's. Her kiosk scan goes green. His goes red; he queues at the inspection point, shows a suitcase of clothes, and is through in eleven minutes — unremarkable, because everything was in his hands. Both done, the gate releases, they check in at 12:05.

Three weeks later, ¥13,840 has arrived across three operators. One operator is ¥260 light; UJ-034 records it, and the implied fee updates. One receipt is still outstanding at day 21 and UJ-035 gives her the operator's contact page and the four facts she needs.

### P2 — Alex, Kansai, 07:45 departure

The watch is the whole story. Logged on day 1 at ¥1,280,000 tax-excluded, 10%, ¥128,000 of tax — more than everything else combined. UJ-020 tells him on the night before to bring the certificate and warranty, which are in the box in his suitcase; he moves them to his jacket.

UJ-022 does unforgiving arithmetic: 07:45 flight, 60-minute check-in requirement, 60-minute tax-free buffer, so leave the hotel by 04:50. He hates it and he does it.

05:50 at Kansai, landside. Three claimable receipts. The whisky and snacks are gift-wrapped and unopened, so UJ-018 passed cleanly the night before. The kiosk goes red — unsurprising with a ¥1.28m item. He shows the watch, the certificate and the lens. Eight minutes. Green on the second traveler-less checklist, gate released, bag dropped at 06:20.

Had he checked the bag first — the natural thing to do at 05:50 when the check-in desk is right there and empty — the watch would have been inside it and ¥128,000 would have been gone. UJ-026 is the entire value of the app, for this user, in one screen.

---

## Open questions for UX

1. **Where does Airport Mode live?** It must be unmissable on departure day and invisible on day two. A date-triggered banner, a tab, or a different home screen entirely — design's call.
2. **How hard is the hard gate?** UJ-026 can be a warning, a confirmation dialogue, or a genuine block. My recommendation is a persistent state plus a friction-ful override, never a silent dismissal, because the cost is irreversible and the user is distracted.
3. **How do we show "estimated"?** Three different numbers coexist — tax on the receipt, estimated net after fees, actually received. They must be visually distinguishable at a glance without three labels of text.
4. **Threshold indicator placement.** It is most valuable inside the shop and least valuable afterwards. In the logging flow, or on the shop group, or both?
5. **Does "will not claim" need a reason?** It improves the trip summary and the user's learning, but it is another tap at a bad moment.

Ask me (JapanExpert) before inventing terminology or inferring a rule. The counter-intuitive parts of this system are counter-intuitive in both languages, and a plausible-sounding guess is how we would ship a wrong instruction to someone standing at a kiosk.
