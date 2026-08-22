(function(){
"use strict";
const B=[
["lang-socks","A Client asks about the socks. How do you present them?","They're a great add-on if you want them.","They're a Solution Component that protects comfort every hour.","right","Solution Component — not an optional extra.","Add-on language separates the system.","Complete Solution"],
["partial","Support in one pair, unsupported 16 hours…","They haven't solved the problem — only part of it.","That's an extra conversation for later.","left","Partial Solution is incomplete.","Extra puts the rest of the day outside the Solution.","Complete Solution"],
["brooks","What job do Brooks Ghost & Adrenaline do?","Premium upsell after the supports.","They carry the correction into shoes the Client wears most.","right","Supports work when footwear works with them.","Name the job, not the transaction.","Complete Solution"],
["cart","How should you handle supports, shoes, socks, MedMassager?","Present every piece deliberately — Rolex-level care.","Set them down quickly so you can keep talking.","left","Careless handling makes $525 feel like $20.","Messy cart = discount bin.","Non-Tangible Value"],
["wrap","In W.R.A.P., what does W — Why — do?","Help them understand the need. Educate.","Pitch the price and 3-Step immediately.","left","W = Why: understand the need first.","Price first skips trust.","W.R.A.P."],
["ready","What is R — Ready — in W.R.A.P.?","Ask if they can afford it before they stand.","Build enthusiasm — let them feel the lift.","right","Ready taps emotion: feel the lift.","Money before feeling kills Ready.","W.R.A.P."],
["yelp","Delighted Client leaving. Yelp?","Ask for a five-star Yelp review.","Let them know you're on Yelp — never ask.","right","Yelp prohibits soliciting reviews.","Never ask for a Yelp review.","Reviews"],
["3step","The 3-Step System is…","One pair plus optional extras.","Three pairs: Strengthener, Maintainer, Relaxer — as a system.","right","Worn together as a system.","A single pair is partial.","Product Knowledge"],
["strength","Strengthener's job?","Workhorse — repositions foot, four arches, longest adjustment.","Mild support, any shoe, little adjustment.","left","Strengtheners reposition the foot.","That's a Relaxer.","Product Knowledge"],
["dress","Walk-in: \"Do you carry dress shoes?\" First move:","No, we don't stock those.","I'd love to help. What are you hoping to find?","right","Don't say no. Ask, seat, imprint.","No kills the conversation.","Inquiries"],
["gold","Client: \"My feet kill me by lunch.\" You should…","Stay quiet — that is gold.","Jump in with the 3-Step before they finish.","left","Stay quiet when they give gold.","Interrupting gold is a pitfall.","Inquiries"],
["push","Investment higher than expected. FIRST:","Remove the most expensive component.","Reconnect to the goal before changing the Solution.","right","Never step down first — reconnect.","Pulling pieces trains padding.","Complete Solution"],
["classic","Most popular Strengthener?","Classic — metatarsal support, heel-pain relief.","Max — thinnest, little adjustment.","left","Classic is most popular for heel pain.","Max is firmest, not thinnest.","Product Knowledge"],
["wow","A WOW Moment happens when a guest…","Feels heard and cared for — real relief or hope.","Buys the full system and leaves quickly.","left","WOW = Empathy + Expertise + Experience.","Speed-to-close is not a WOW.","WOW Moments"],
["educate","People want to be ______, not sold.","Entertained — short and flashy.","Educated — they sell themselves if you educate.","right","Educated, not sold.","Flash without education is a pitch.","WOW Moments"],
["incent","Offer a gift for a review?","Yes, if the fitting was great.","Never — on any platform.","right","Never incentive reviews.","Prohibited on all platforms.","Reviews"]
].map(r=>({id:r[0],prompt:r[1],left:r[2],right:r[3],correct:r[4],why:r[5],bad:r[6],src:r[7]}));
const N=5,T=32,G=.55,J=-10.2,R=3.4;
const sh=a=>{const x=a.slice();for(let i=x.length-1;i>0;i--){const j=Math.ra