const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add("visible")}),{threshold:.08});
document.querySelectorAll(".reveal").forEach(el=>io.observe(el));
document.querySelectorAll('a[href^="https://t.me/AtlantaVPN_bot"]').forEach(a=>a.addEventListener("click",()=>{try{gtag("event","affiliate_click",{event_category:"telegram",event_label:"AtlantaVPN"})}catch(e){}}));
