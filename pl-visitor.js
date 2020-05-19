const {log,start}=require("./pbp");

( async ()=>{
    let bp=await start(false);
    await bp.page.goto("http://139.9.76.106/#/papers/234",{timeout:0})

    let p1=await bp.browser.newPage();
    await p1.goto("http://139.9.76.106/#/papers/217");
    await p1.waitFor(1000*60);
    await bp.page.waitFor(1000*60);
    await p1.goto("http://139.9.76.106/#/pass/1244");
    await p1.waitFor(1000*60);
    await bp.browser.close();
})()