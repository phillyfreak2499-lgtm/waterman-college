window.FOURTH = (function(){
  "use strict";
  var ALL = "max honeycomb classic sls diamond hug ultra miracle-flex slm mid-flex flex deluxe deluxe-plus tss flex-relaxer slr skinny";
  var MARK = {
    walking: ALL, standing: ALL, sitting: ALL, driving: ALL, lifting: ALL, hard: ALL,
    ladders: "max honeycomb classic diamond hug ultra miracle-flex slm mid-flex flex deluxe deluxe-plus tss flex-relaxer slr skinny",
    run: "ultra miracle-flex slm mid-flex flex tss flex-relaxer slr skinny",
    hike: "ultra miracle-flex slm flex deluxe tss flex-relaxer slr skinny",
    cycle: "ultra miracle-flex slm mid-flex flex tss flex-relaxer slr skinny",
    lift: "max honeycomb classic ultra miracle-flex slm mid-flex flex deluxe deluxe-plus tss flex-relaxer slr skinny",
    gym: "ultra miracle-flex slm mid-flex flex deluxe deluxe-plus tss flex-relaxer slr skinny",
    sports: "ultra miracle-flex slm mid-flex flex tss flex-relaxer slr skinny",
    court: "ultra miracle-flex slm mid-flex flex tss flex-relaxer slr",
    golf: "max honeycomb classic sls ground-force diamond hug deluxe deluxe-plus skinny",
    hunt: "ultra miracle-flex slm mid-flex flex deluxe tss flex-relaxer slr skinny",
    garden: "max honeycomb classic sls diamond hug ultra miracle-flex slm mid-flex flex deluxe tss flex-relaxer slr skinny",
    shop: ALL, athletic: ALL + " ground-force",
    dress: "sls ultra miracle-flex slm mid-flex flex deluxe deluxe-plus tss flex-relaxer slr skinny",
    heels: "ultra miracle-flex slm mid-flex flex tss flex-relaxer slr skinny",
    flats: "max honeycomb classic sls ultra miracle-flex slm mid-flex flex deluxe tss flex-relaxer slr skinny",
    workboot: ALL + " ground-force", boots: ALL + " ground-force", slipper: ALL, sandal: ALL, house: ALL
  };
  MARK.ladders = MARK.ladders.replace(" sls", "").replace(" ground-force", "");
  function skuMarked(row, sku) {
    var list = MARK[row];
    if (!list) return false;
    if (sku === "ground-force") {
      return (" " + list + " ").indexOf(" ground-force ") >= 0 ||
        (row === "golf" && (" " + list + " ").indexOf(" sls ") >= 0);
    }
    return (" " + list + " ").indexOf(" " + sku + " ") >= 0;
  }
  var SKUS = {
    max: { id: "max", name: "Max", family: "strengthener", file: "catalog/max.jpg", note: "Firmest Strengthener. High arch." },
    honeycomb: { id: "honeycomb", name: "Honeycomb", family: "strengthener", file: "catalog/honeycomb.jpg", note: "Rigid Strengthener. Standing load." },
    classic: { id: "classic", name: "Classic", family: "strengthener", file: "catalog/classic.jpg", note: "Standard Strengthener." },
    sls: { id: "sls", name: "SLS", family: "strengthener", file: "catalog/sls.jpg", note: "The Strengthener that fits dress. Name it SLS in dress." },
    "ground-force": { id: "ground-force", name: "Ground Force", family: "strengthener", file: "catalog/ground-force.jpg", note: "SLS chassis named for the course. Comfort and stability only." },
    diamond: { id: "diamond", name: "Diamond", family: "strengthener", file: "catalog/diamond.jpg", note: "Softer Strengthener. Flat-to-average." },
    hug: { id: "hug", name: "Hug", family: "strengthener", file: "catalog/hug.jpg", note: "Softest Strengthener." },
    ultra: { id: "ultra", name: "Ultra", family: "maintainer", file: "catalog/ultra.jpg", note: "Sports Maintainer. Flat heel." },
    "miracle-flex": { id: "miracle-flex", name: "Miracle Flex", family: "maintainer", file: "catalog/miracle-flex.jpg", note: "The pair the chart names out loud for a run." },
    slm: { id: "slm", name: "SLM", family: "maintainer", file: "catalog/slm.jpg", note: "Slim Maintainer. Dress and tight shoes." },
    "mid-flex": { id: "mid-flex", name: "Mid-Flex", family: "maintainer", file: "catalog/mid-flex.jpg", note: "Average-arch Maintainer. Blank on hiking." },
    flex: { id: "flex", name: "Flex", family: "maintainer", file: "catalog/flex.jpg", note: "Sports Maintainer. Flat heel." },
    deluxe: { id: "deluxe", name: "Deluxe", family: "maintainer", file: "catalog/deluxe.jpg", note: "Deep heel cup. Marked for hunting. Blank on court." },
    "deluxe-plus": { id: "deluxe-plus", name: "Deluxe Plus", family: "maintainer", file: "catalog/deluxe-plus.jpg", note: "Tighter than Deluxe. Blank on hunting, hiking, flats, running." },
    tss: { id: "tss", name: "TSS", family: "maintainer", file: "catalog/tss.jpg", note: "Maintainer. Blank on golf." },
    "flex-relaxer": { id: "flex-relaxer", name: "Flex Relaxer", family: "relaxer", file: "catalog/flex-relaxer.jpg", note: "Home / recovery pair." },
    slr: { id: "slr", name: "SLR", family: "relaxer", file: "catalog/slr.jpg", note: "Slim Relaxer. Wider foot." },
    skinny: { id: "skinny", name: "Skinny", family: "relaxer", file: "catalog/skinny.jpg", note: "Thin Relaxer. Blank on court." }
  };
  var SKU_ORDER = ["max","honeycomb","classic","sls","ground-force","diamond","hug","ultra","miracle-flex","slm","mid-flex","flex","deluxe","deluxe-plus","tss","flex-relaxer","slr","skinny"];
  var FAMS = [
    { id: "sports", name: "Sports Maintainer", file: "family/maintainer.jpg", blurb: "Court, run, gym, hunting boot. Flat heel. You do not work out in a Strengthener." },
    { id: "dress", name: "Dress Maintainer", file: "family/dress.jpg", blurb: "Loafers, heels, church, dance." },
    { id: "everyday", name: "2nd Everyday Maintainer", file: "family/everyday.jpg", blurb: "Packed bag / layover pair that cannot swap at 5 a.m." },
    { id: "strengthener", name: "2nd Strengthener", file: "family/strengthener.jpg", blurb: "Golf or a second standing boot. Heel counter. Ground Force on the course." },
    { id: "relaxer", name: "2nd Relaxer", file: "family/relaxer.jpg", blurb: "Rare. Two homes / guest room. Age does not invent this." }
  ];
  var FAM_MAP = {};
  FAMS.forEach(function (f) { FAM_MAP[f.id] = f; });
  function placeGold(c) {
    return {
      P: c.playback,
      L: "Your 3-system already lives in " + c.placed + ".",
      A: "That leaves your " + c.leftoverShoe + ".",
      C: "This 4th pair is a " + FAM_MAP[c.goldFam].name + " that lives in your " + c.leftoverShoe + ".",
      E: c.ease
    };
  }
  var CLIENTS = [
    { id: "tyler", name: "Tyler Brooks", age: 29, photo: "portraits/tyler.jpg", job: "Warehouse lead", jobHours: "10-hour standing shifts on concrete", play: "train for a 5K in running shoes", quote: "The work pair is great. I just start to feel it when I go run after shift.", placed: "work boots, everyday sneakers, and house slippers", leftoverShoe: "running shoes", leftoverLife: "run", leftoverShoeRow: "athletic", goldFam: "sports", goldSkus: ["miracle-flex","flex","ultra","slm","mid-flex","tss"], first: "miracle-flex", arch: "average", playback: "You stand 10-hour warehouse shifts. You also train for a 5K.", ease: "So the run after shift stays comfortable.", traps: ["gym-str","price"] },
    { id: "maria", name: "Maria Santos", age: 42, photo: "portraits/maria.jpg", job: "Third-grade teacher", jobHours: "on your feet in the classroom all day", play: "wear dress flats to church on Sunday", quote: "Weekdays are covered. Sunday shoes still feel empty.", placed: "teaching sneakers, everyday pair, and home pair", leftoverShoe: "church flats", leftoverLife: "dress", leftoverShoeRow: "flats", goldFam: "dress", goldSkus: ["slm","miracle-flex","flex","ultra","mid-flex","deluxe","tss"], first: "slm", arch: "average", playback: "You are on your feet in the classroom all day. You also wear flats to church on Sunday.", ease: "So Sunday in those flats feels like the week you already liked.", traps: ["age-relax","pack"] },
    { id: "james", name: "James Porter", age: 55, photo: "portraits/james.jpg", job: "Branch manager", jobHours: "standing the floor most of the day", play: "play 18 every Saturday in golf shoes", quote: "Work is locked in. The course is the pair that still floats.", placed: "work shoes, everyday pair, and recovery pair", leftoverShoe: "golf shoes", leftoverLife: "golf", leftoverShoeRow: "athletic", goldFam: "strengthener", goldSkus: ["ground-force","sls","classic","max","honeycomb","diamond","hug"], first: "ground-force", arch: "high", playback: "You stand the branch floor most of the day. You also play 18 every Saturday.", ease: "So the course pair stays planted. Comfort, fit, stability.", traps: ["golf-flex","swing"] },
    { id: "helen", name: "Helen Ward", age: 72, photo: "portraits/helen.jpg", job: "Retired", jobHours: "light days at home", play: "fly to see the grandkids and cannot swap pairs at 5 a.m.", quote: "I already have a home pair. I just need one that lives in the bag.", placed: "everyday walking pair and the home pair", leftoverShoe: "packed travel pair", leftoverLife: "shop", leftoverShoeRow: "athletic", goldFam: "everyday", goldSkus: ["flex","slm","miracle-flex","mid-flex","ultra","deluxe","tss"], first: "flex", arch: "average", playback: "You have light days at home. You also fly to see the grandkids and cannot swap pairs at 5 a.m.", ease: "So the pair in the bag is ready when the plane lands.", traps: ["age-relax","skip"] },
    { id: "kevin", name: "Kevin Hale", age: 34, photo: "portraits/kevin.jpg", job: "HVAC tech", jobHours: "on your feet in work boots", play: "CrossFit five mornings a week", quote: "Don't put the work pair in my gym shoes. I learned that the hard way.", placed: "work boots, everyday pair, and home pair", leftoverShoe: "gym shoes", leftoverLife: "gym", leftoverShoeRow: "athletic", goldFam: "sports", goldSkus: ["flex","miracle-flex","ultra","slm","mid-flex","deluxe","deluxe-plus","tss"], first: "flex", arch: "average", playback: "You work in boots all day. You also do CrossFit five mornings a week.", ease: "So the box session has a flat-heel pair that belongs there.", traps: ["gym-str","pack"] },
    { id: "ashley", name: "Ashley Nguyen", age: 38, photo: "portraits/ashley.jpg", job: "OR nurse", jobHours: "12-hour standing shifts", play: "wear high heels to a wedding party next month", quote: "Work is handled. I am not walking that reception in an empty heel.", placed: "clinic clogs, everyday pair, and home pair", leftoverShoe: "dress heels", leftoverLife: "heels", leftoverShoeRow: "heels", goldFam: "dress", goldSkus: ["slm","miracle-flex","flex","ultra","mid-flex","tss"], first: "slm", arch: "average", playback: "You stand 12-hour clinic shifts. You also have a wedding in heels next month.", ease: "So the heel has a slim pair that actually fits it.", traps: ["heels-deluxe","price"] },
    { id: "robert", name: "Robert Chen", age: 48, photo: "portraits/robert.jpg", job: "Site supervisor", jobHours: "standing the job site", play: "hunt weekends in a hunting boot", quote: "Work boot is set. The hunting boot is the empty one.", placed: "work boots, everyday pair, and home pair", leftoverShoe: "hunting boots", leftoverLife: "hunt", leftoverShoeRow: "boots", goldFam: "sports", goldSkus: ["deluxe","miracle-flex","flex","ultra","slm","mid-flex","tss"], first: "deluxe", arch: "flat", playback: "You stand the job site. You also hunt weekends in a hunting boot.", ease: "So the hunting boot has the pair the chart marks for that leftover.", traps: ["hunt-plus","gym-str"] },
    { id: "priya", name: "Priya Shah", age: 31, photo: "portraits/priya.jpg", job: "Consultant", jobHours: "airport Mondays and client offices", play: "keep a pair packed because you cannot swap at 5 a.m.", quote: "Home city is covered. The bag is not.", placed: "office pair, home pair, and the pair you walk the dog in", leftoverShoe: "packed layover pair", leftoverLife: "shop", leftoverShoeRow: "athletic", goldFam: "everyday", goldSkus: ["flex","slm","miracle-flex","mid-flex","ultra","deluxe","tss"], first: "flex", arch: "average", playback: "You fly airport Mondays. You also keep a pair packed because you cannot swap at 5 a.m.", ease: "So the pair in the bag is the one that lives there.", traps: ["skip","pack"] },
    { id: "marcus", name: "Marcus Reed", age: 40, photo: "portraits/marcus.jpg", job: "High-school coach", jobHours: "on the sideline after classroom hours", play: "play rec-league basketball in court shoes", quote: "Classroom pair is done. Court shoes still have nothing in them.", placed: "teaching shoes, everyday pair, and home pair", leftoverShoe: "court shoes", leftoverLife: "court", leftoverShoeRow: "athletic", goldFam: "sports", goldSkus: ["miracle-flex","flex","ultra","slm","mid-flex","tss"], first: "miracle-flex", arch: "high", playback: "You coach on the sideline after class. You also play rec-league basketball.", ease: "So the court pair is a flat-heel Maintainer, not a Strengthener.", traps: ["gym-str","court-deluxe"] },
    { id: "sandra", name: "Sandra Diaz", age: 67, photo: "portraits/sandra.jpg", job: "Part-time librarian", jobHours: "short desk-and-stack shifts", play: "spend long weekends at the lake house", quote: "I already have a home pair here. The lake house slippers are empty.", placed: "work pair, everyday pair, and the pair at this house", leftoverShoe: "lake-house slippers", leftoverLife: "house", leftoverShoeRow: "slipper", goldFam: "relaxer", goldSkus: ["skinny","flex-relaxer","slr"], first: "skinny", arch: "average", playback: "You work short library shifts. You also spend long weekends at the lake house.", ease: "So the lake house has its own recovery pair waiting.", traps: ["age-relax","pack"] },
    { id: "david", name: "David Cole", age: 44, photo: "portraits/david.jpg", job: "Desk analyst", jobHours: "mostly seated, short walks between meetings", play: "play pickleball three nights a week", quote: "People keep telling me I don't need a 4th because I sit. My court shoes disagree.", placed: "everyday pair, a light work pair, and home pair", leftoverShoe: "pickleball court shoes", leftoverLife: "court", leftoverShoeRow: "athletic", goldFam: "sports", goldSkus: ["miracle-flex","flex","ultra","slm","mid-flex","tss"], first: "flex", arch: "average", playback: "You sit most of the workday. You also play pickleball three nights a week.", ease: "So the court nights have the leftover pair, sitting job or not.", traps: ["skip","gym-str"] },
    { id: "linda", name: "Linda Brooks", age: 58, photo: "portraits/linda.jpg", job: "Office manager", jobHours: "on your feet around the office", play: "choir practice in dress shoes twice a week", quote: "Work is covered. Choir shoes still slap.", placed: "work pair, everyday pair, and home pair", leftoverShoe: "choir dress shoes", leftoverLife: "dress", leftoverShoeRow: "dress", goldFam: "dress", goldSkus: ["slm","miracle-flex","flex","ultra","mid-flex","deluxe","deluxe-plus","tss"], first: "slm", arch: "average", playback: "You are on your feet around the office. You also go to choir in dress shoes twice a week.", ease: "So choir nights have a slim pair that lives in those dress shoes.", traps: ["price","medical"] }
  ];
  var CLIENT_MAP = {};
  CLIENTS.forEach(function (c) { CLIENT_MAP[c.id] = c; });
  var TRAPS = {
    "gym-str": { label: "Put a Strengthener in the leftover gym / run / court shoe.", why: "Gym, run, and court are Maintainers. Heel cups do not run." },
    "golf-flex": { label: "Put Miracle Flex / Flex / Ultra / Mid-Flex / TSS in the golf shoe.", why: "Golf wants a heel counter. Flex-family Maintainers are blank on golf." },
    "age-relax": { label: "Give them a 2nd Relaxer because of their age.", why: "Age is a modifier. It does not invent the leftover shoe." },
    skip: { label: "They sit / they are fine — skip the 4th.", why: "Find the empty shoe first. A desk job can still leave a court shoe empty." },
    pack: { label: "Pitch the 4-pack and add it at the register.", why: "The 4th is PLACE, not a 4-pack and not a close." },
    price: { label: "Wink at the price and ask if they want to add it.", why: "Ease is the outcome they already asked for. No price. No close." },
    medical: { label: "Tell them this pair will treat the pain.", why: "Good Feet Arch Supports are not intended to treat or correct any physical ailment." },
    swing: { label: "Tell them Ground Force will add distance to the swing.", why: "Ground Force talk is comfort, fit, and stability. Never swing, distance, or handicap." },
    "hunt-plus": { label: "Put Deluxe Plus in the hunting boot.", why: "Hunting marks Deluxe. Deluxe Plus is blank — it is tighter than Deluxe." },
    "heels-deluxe": { label: "Put Deluxe or Classic in the high heel.", why: "High heels take slim Maintainers and Relaxers. Deluxe and Classic do not fit that leftover." },
    "court-deluxe": { label: "Put Deluxe in the court shoe.", why: "Deluxe and Skinny are blank on court / team sports." }
  };
  var LEARN = [
    { title: "The 3-system already has jobs", body: "Strengthener, Maintainer, and Relaxer each have an hour. That system lives in the everyday pair they walked in wearing. The moment they change shoes — 5K, steel-toe shift, wedding, lake — the support stays behind. The 4th closes that gap. It is not a bigger sale. It finishes the Solution." },
    { title: "Find the empty shoe first", body: "Hear the activity in the Interview before they ask. Soccer three nights, a nurse who changes shoes at clock-in, 18 holes on Saturday — that is where the foot will be unsupported. Age is a modifier, not the leftover. The leftover shoe is the one still empty." },
    { title: "Five leftover families", body: "Sports Maintainer — court, run, gym, hunting boot. Dress Maintainer — loafers, heels, church, dance. 2nd Everyday Maintainer — packed bag / layover. 2nd Strengthener — golf or a second standing boot. 2nd Relaxer — rare. Two homes. Do not auto-fire because they are 70+." },
    { title: "How to read the R5 chart", body: "Tap the leftover activity. Only marked SKUs are legal. Blank = wrong for that leftover. Lighter color on the chart = softer. Match the arch in front of you." },
    { title: "Hard vetoes", body: "No Strengthener in gym / run / court. No Flex family on golf. No auto Relaxer for age. Deluxe is blank on running. Deluxe Plus is blank on hunting, hiking, flats, and running. Deluxe and Skinny are blank on court. SLS and Ground Force are blank on ladders." },
    { title: "PLACE, in this order", body: "P Playback — their job hours and play in their words. L Locate — park the 3-system in shoes. A Aperture — name the leftover shoe. C Cover — This 4th pair is [type] that lives in [leftover shoe]. E Ease — the outcome they already asked for. No price. No want to add it. No medical claim." },
    { title: "What never to say", body: "Never would you like to add another support. Ask what the foot needs when they do the thing they love, or the thing work requires. There are no add-ons. Do not pitch a 4-pack. Do not wink at price. Do not make a medical claim. Ground Force is comfort, fit, stability — never swing, distance, or handicap." },
    { title: "Worked client", body: "Read James. The leftover is the golf shoe. Family, SKU, and PLACE are shown under the card." }
  ];
  var HOW = [
    { title: "What this is", body: "They already have three pairs in some of their shoes. The 4th is the pair for the shoe that is still empty. That empty shoe is the leftover shoe." },
    { title: "The path", body: "Do the tiles in order: Learn, then Practice, then Check. Tile 4 is the chart you can open on the floor. It is not a test." },
    { title: "How a client card works", body: "Read the job and the play. See which shoes already have pairs. The leftover shoe is the highlighted chip. Age does not invent that shoe." },
    { title: "How you pass", body: "Practice is 4 people and tells you if you were right after each one. Check is 8 people, 80%, no hints. Then role-play one leftover shoe with your manager." }
  ];
  return {
    ALL: ALL, MARK: MARK, SKUS: SKUS, SKU_ORDER: SKU_ORDER,
    FAMS: FAMS, FAM_MAP: FAM_MAP, CLIENTS: CLIENTS, CLIENT_MAP: CLIENT_MAP,
    TRAPS: TRAPS, LEARN: LEARN, HOW: HOW, placeGold: placeGold, skuMarked: skuMarked
  };
})();
