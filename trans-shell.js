const maker=require('./betterdev.js');

// for example
// node betterdev.js -t -s -p="div > a" https://betterdev.link -r -to="192.168.16.102"
// node betterdev.js -c -r -to="192.168.16.102" https://blog.cloudflare.com/when-bloom-filters-dont-bloom/
// -t should translate
// -s is by summary
// -c is by content
// -r is report to web service
// -to web service url
// -p url pattern,used when have -s,default is "a"
// url the url to fetch
(async ()=>{
    let p=maker.getPrm();
    await maker.makeArticle(p);
})()