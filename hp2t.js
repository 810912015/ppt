const htmlparser2 = require("htmlparser2");
const gtrans =require("./gtrans")
const tags={
    html:"",
    cfg:{
        ignore: {
            noscript: true,
            script:true,
            form:true,
            input:true,
            label:true,
            button:true,
            style:true,
            footer:true,
            link:true
        },
        untouch:{
            pre:true,
            code:true,
            svg:true
        },
        attr:{
            a:["href"],
            img:["src","alt"]
        },

    },
    include:true,
    untouch:false
};
function isIgnore(name) {
    return name in tags.cfg.ignore;
}
function isUntouch(name) {
   return name in tags.cfg.untouch;
}
function writeOpen(name,attrs) {
    if(!(name in tags.cfg.attr)&&!isUntouch(name)&&!tags.untouch) return;
    tags.html+="<";
    tags.html+=name;
    if(name in tags.cfg.attr){
        let ta=tags.cfg.attr[name];
        ta.forEach(a=>{
            if(a in attrs){
                tags.html+=" "+a+"='"+attrs[a]+"'"
            }
        })
    }else if(tags.untouch){
        if(name!="pre"&&name!="code"){
            for(a in attrs){
                tags.html+=" "+a+"='"+attrs[a]+"'"
            }
        }

    }
    tags.html+=">"
}

async function simply(str) {
    console.log("start")
    let gt=await gtrans.prepare();
    console.log("gtrans ready")
    tags.html="";
    const parser = new htmlparser2.Parser(
        {
            onopentag(name, attribs) {
                console.log("open",name,attribs)
                if(isIgnore(name)){
                    tags.include=false
                    return;
                }
                if(isUntouch(name)){
                    tags.untouch=true;
                }
                writeOpen(name,attribs)
            },
            async ontext(text) {
                console.log("text",text,!text)
                if(!text) return ;
                if(tags.include) {
                    if(tags.untouch){
                        tags.html += text;
                    }else{
                        let tr=await gtrans.translate(gt.page,text).catch(a=>text)
                        tags.html+=tr
                        console.log("tr",text,tr)
                    }
                }
            },
            onclosetag(name) {
                console.log("close",name)
                if(isIgnore(name)){
                    tags.include=true
                    return;
                }
                if(isUntouch(name)){
                    tags.untouch=false;
                }
                if(tags.untouch||(name in tags.cfg.attr)||name in tags.cfg.untouch){
                    tags.html+="</"+name+">";
                }else{
                    if(!tags.html.endsWith("\n")){
                        tags.html+="\n";
                    }
                }
            }
        },
        { decodeEntities: true }
    );

    console.log("parser ready")
    parser.write(str);
    console.log("parser write done")
    parser.end();
    console.log("parser end")
    const r=tags.html;
    // await gt.browser.close();
    // console.log("gtrans close")
    return r;
}
function addWithAttr(name,attrs) {
    let html="";
    html+="<";
    html+=name;
    for(let a in attrs){
        html+=" "+a+"='"+attrs[a]+"'"
    }
    html+=">"
    return html;
}
async function simply2(str) {
    console.log("start")
    let gt=await gtrans.prepare();
    console.log("gtrans ready")
    let isPre=false;
    let result="";
    let ignore=false;
    const parser = new htmlparser2.Parser(
        {
            onopentag(name, attribs) {
                let r="";
                if(name==="script"||name==="link"||name==="style") {
                    ignore=true;
                    return;
                }
                if(name==="pre"){
                    isPre=true;
                    r="<"+name+">"
                    console.log(r);
                    result+=r;
                }else if(!isPre){
                    if(name==="img"){
                        r=addWithAttr(name,attribs);
                        console.log(r);
                        result+=r;
                    }
                }

            },
            async ontext(text) {
                let r="";
                if(ignore) return ;

                if(isPre){
                    r=text;
                    console.log(r);
                    result+=r;
                }else{
                    if(text.length<5){
                        r=text
                        console.log(r);
                        result+=r;
                    }else {
                        r = await gtrans.translate(gt.page,text).catch(a=>text)

                        console.log(r);
                        result+=r;
                    }
                }

            },
            onclosetag(name) {
                if(name==="script"||name==="link"||name==="style") {
                    ignore=false;
                    return;
                }
                let r="";
                if(name==="pre"){
                    isPre=false;
                    r="</"+name+">";
                    console.log(r);
                    result+=r;
                }else if(name==="img"){
                    r="</"+name+">";
                    console.log(r);
                    result+=r;
                }

            }
        },
        { decodeEntities: true }
    );

    console.log("parser ready")
    parser.write(str);
    console.log("parser write done")
    parser.end();
    console.log("parser end")
    return result;
}

module.exports={simply2};

async function test() {
    function gets3(){
        return " <nav class=\"navbar navbar-default navbar-fixed-top navbar-custom\">\n" +
            "  <div class=\"container-fluid\">\n" +
            "    <div class=\"navbar-header\">\n" +
            "      <button type=\"button\" class=\"navbar-toggle\" data-toggle=\"collapse\" data-target=\"#main-navbar\">\n" +
            "        <span class=\"sr-only\">Toggle navigation</span>\n" +
            "        <span class=\"icon-bar\"></span>\n" +
            "        <span class=\"icon-bar\"></span>\n" +
            "        <span class=\"icon-bar\"></span>\n" +
            "      </button>\n" +
            "      <a class=\"navbar-brand\" href=\"https://sookocheff.com\">Kevin Sookocheff</a>\n" +
            "    </div>\n" +
            "\n" +
            "    <div class=\"collapse navbar-collapse\" id=\"main-navbar\">\n" +
            "      <ul class=\"nav navbar-nav navbar-right\">\n" +
            "        \n" +
            "          \n" +
            "            <li>\n" +
            "              <a title=\"Blog\" href=\"/\">Blog</a>\n" +
            "            </li>\n" +
            "          \n" +
            "        \n" +
            "          \n" +
            "            <li>\n" +
            "              <a title=\"About\" href=\"/page/about/\">About</a>\n" +
            "            </li>\n" +
            "          \n" +
            "        \n" +
            "          \n" +
            "            <li class=\"navlinks-container\" style=\"min-width: 77px;\">\n" +
            "              <a class=\"navlinks-parent\">Subscribe</a>\n" +
            "              <div class=\"navlinks-children\">\n" +
            "                \n" +
            "                  <a href=\"https://sookocheff.us3.list-manage.com/subscribe?u=8b57d632b8677f07ca57dc9cb&amp;id=ec7ddaa3ba\">email</a>\n" +
            "                \n" +
            "                  <a href=\"/index.xml\">RSS</a>\n" +
            "                \n" +
            "              </div>\n" +
            "            </li>\n" +
            "          \n" +
            "        \n" +
            "\n" +
            "        \n" +
            "\n" +
            "        \n" +
            "      </ul>\n" +
            "    </div>\n" +
            "\n" +
            "    \n" +
            "      <div class=\"avatar-container\">\n" +
            "        <div class=\"avatar-img-border\">\n" +
            "          <a title=\"Kevin Sookocheff\" href=\"https://sookocheff.com\">\n" +
            "            <img class=\"avatar-img\" src=\"https://sookocheff.com/img/avatar.png\" alt=\"Kevin Sookocheff\">\n" +
            "          </a>\n" +
            "        </div>\n" +
            "      </div>\n" +
            "    \n" +
            "\n" +
            "  </div>\n" +
            "</nav>\n" +
            "\n" +
            "\n" +
            "\n" +
            "\n" +
            "    \n" +
            "\n" +
            "\n" +
            "<div class=\"pswp\" tabindex=\"-1\" role=\"dialog\" aria-hidden=\"true\">\n" +
            "\n" +
            "<div class=\"pswp__bg\"></div>\n" +
            "\n" +
            "<div class=\"pswp__scroll-wrap\">\n" +
            "    \n" +
            "    <div class=\"pswp__container\">\n" +
            "      <div class=\"pswp__item\"></div>\n" +
            "      <div class=\"pswp__item\"></div>\n" +
            "      <div class=\"pswp__item\"></div>\n" +
            "    </div>\n" +
            "    \n" +
            "    <div class=\"pswp__ui pswp__ui--hidden\">\n" +
            "    <div class=\"pswp__top-bar\">\n" +
            "      \n" +
            "      <div class=\"pswp__counter\"></div>\n" +
            "      <button class=\"pswp__button pswp__button--close\" title=\"Close (Esc)\"></button>\n" +
            "      <button class=\"pswp__button pswp__button--share\" title=\"Share\"></button>\n" +
            "      <button class=\"pswp__button pswp__button--fs\" title=\"Toggle fullscreen\"></button>\n" +
            "      <button class=\"pswp__button pswp__button--zoom\" title=\"Zoom in/out\"></button>\n" +
            "      \n" +
            "      \n" +
            "      <div class=\"pswp__preloader\">\n" +
            "        <div class=\"pswp__preloader__icn\">\n" +
            "          <div class=\"pswp__preloader__cut\">\n" +
            "            <div class=\"pswp__preloader__donut\"></div>\n" +
            "          </div>\n" +
            "        </div>\n" +
            "      </div>\n" +
            "    </div>\n" +
            "    <div class=\"pswp__share-modal pswp__share-modal--hidden pswp__single-tap\">\n" +
            "      <div class=\"pswp__share-tooltip\"></div>\n" +
            "    </div>\n" +
            "    <button class=\"pswp__button pswp__button--arrow--left\" title=\"Previous (arrow left)\">\n" +
            "    </button>\n" +
            "    <button class=\"pswp__button pswp__button--arrow--right\" title=\"Next (arrow right)\">\n" +
            "    </button>\n" +
            "    <div class=\"pswp__caption\">\n" +
            "      <div class=\"pswp__caption__center\"></div>\n" +
            "    </div>\n" +
            "    </div>\n" +
            "    </div>\n" +
            "</div>\n" +
            "\n" +
            "\n" +
            "  \n" +
            "  \n" +
            "  \n" +
            "\n" +
            "\n" +
            "\n" +
            "\n" +
            "\n" +
            "\n" +
            "  \n" +
            "\n" +
            "  <header class=\"header-section \">\n" +
            "    \n" +
            "    <div class=\"intro-header no-img\">\n" +
            "      <div class=\"container\">\n" +
            "        <div class=\"row\">\n" +
            "          <div class=\"col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1\">\n" +
            "            <div class=\"post-heading\">\n" +
            "              \n" +
            "                <h1>How Does DNS Work?</h1>\n" +
            "              \n" +
            "              \n" +
            "              \n" +
            "              \n" +
            "                <span class=\"post-meta\">\n" +
            "  \n" +
            "  \n" +
            "  <i class=\"fas fa-calendar\"></i>&nbsp;Posted on April 16, 2020\n" +
            "  \n" +
            "  \n" +
            "    &nbsp;|&nbsp;<i class=\"fas fa-clock\"></i>&nbsp;12&nbsp;minutes\n" +
            "  \n" +
            "  \n" +
            "  \n" +
            "    \n" +
            "      &nbsp;|&nbsp;<i class=\"fas fa-user\"></i>&nbsp;Kevin Sookocheff\n" +
            "    \n" +
            "  \n" +
            "  \n" +
            "</span>\n" +
            "\n" +
            "\n" +
            "              \n" +
            "            </div>\n" +
            "          </div>\n" +
            "        </div>\n" +
            "      </div>\n" +
            "    </div>\n" +
            "  </header>\n" +
            "\n" +
            "\n" +
            "    \n" +
            "<div class=\"container\" role=\"main\">\n" +
            "  <div class=\"row\">\n" +
            "    <div class=\"col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1\">\n" +
            "      <article role=\"main\" class=\"blog-post\">\n" +
            "        <p>Before the Internet became a global network connecting millions of devices, it\n" +
            "was a simple research experiment connecting a handful of institutions. In the\n" +
            "beginning, the number of unique internet addresses could be measured in the\n" +
            "tens. As the network expanded that number quickly grew into the hundreds and\n" +
            "thousands and it became difficult to remember and type in IP addresses for each\n" +
            "of these hosts.</p>\n" +
            "<p>To manage the growing number of network hosts, a simple text file, called\n" +
            "<code>HOSTS.txt</code> recorded each host and their IP address. To add your name to the\n" +
            "hosts file, you needed to send an e-mail describing the changes you wanted to\n" +
            "apply. The authority for the <code>HOSTS.txt</code> file would apply these changes once or\n" +
            "twice a week and anyone who wanted to grab the updated list would periodically\n" +
            "FTP to the canonical source, grab the latest file, and update their own list of\n" +
            "hosts. Naturally, as this small network expanded into, and was eventually\n" +
            "replaced by, the Internet, this solution became untenable – there were just too\n" +
            "many hosts to keep track of, keep consistent, and to serve from a single\n" +
            "canonical file using FTP and manual updates. <code>HOSTS.txt</code> did not scale.</p>\n" +
            "<p>The Domain Name System (DNS) was developed to scale the <code>HOSTS.txt</code> model to the\n" +
            "global Internet. The goals for the system were to allow for local administration\n" +
            "of portions of the data set while also making changes and updates to local data\n" +
            "available to the global Internet. The result is a globally distributed\n" +
            "hierarchical database that maps domain names to Internet hosts throughout the\n" +
            "world.</p>\n" +
            "<h2 id=\"the-domain-namespace\">The Domain Namespace</h2>\n" +
            "<p>The DNS distributed database is an inverted tree indexed by domain names. Taken\n" +
            "together, the entire tree is called the <em>domain namespace</em> and represents the\n" +
            "entire set of Internet domain names. Like a file system, the tree begins at a\n" +
            "root node, inner nodes in the tree help organize hosts into domains, and leaf\n" +
            "nodes provide information on a single host. Each node in the tree has a text\n" +
            "label describing its portion of a fully qualified domain name. The full domain\n" +
            "name for any node is the sequence of labels on the path from that node up to the\n" +
            "root of the tree, with a dot separating the text labels along the path. The only\n" +
            "restriction to node labels is that siblings in the tree have unique names to\n" +
            "guarantee that a domain name uniquely identifies a single node in the tree.</p>\n" +
            "<p>An example will help illustrate the concept.</p>\n" +
            "\n" +
            "<link rel=\"stylesheet\" href=\"https://sookocheff.com/css/hugo-easy-gallery.css\">\n" +
            "<div class=\"box\">\n" +
            "  <figure itemprop=\"associatedMedia\" itemscope=\"\" itemtype=\"http://schema.org/ImageObject\">\n" +
            "    <div class=\"img\">\n" +
            "      <img itemprop=\"thumbnail\" src=\"assets/dns-example.png\" alt=\"assets/dns-example.png\">\n" +
            "    </div>\n" +
            "    <a href=\"assets/dns-example.png\" itemprop=\"contentUrl\"></a>\n" +
            "      <figcaption><h4>A simplified domain namespace</h4>\n" +
            "      </figcaption>\n" +
            "  </figure>\n" +
            "</div>\n" +
            "\n" +
            "<p>Remember that domain names are just indexes into the DNS database. For leaf\n" +
            "nodes, the data at the node represents an individual host on the network with\n" +
            "information like the network addresses, mail-routing information, or hardware\n" +
            "information. Nodes inside the tree can represent both a domain and a particular\n" +
            "host. In our example above, the <code>sookocheff.com</code> node represents both the sookocheff\n" +
            "domain and it represents the hosts that serve the <code>sookocheff.com</code> site you are\n" +
            "currently looking at.</p>\n" +
            "<h2 id=\"resource-records-and-zone-files\">Resource Records and Zone Files</h2>\n" +
            "<p>The data indexed by a domain name is called a <em>resource record</em>. There are\n" +
            "several types of records for different types of data. For example, there are\n" +
            "unique resource records for mail routing and for or host address information.\n" +
            "Each record type specifies is own syntax and semantic rules to follow.</p>\n" +
            "<p>The collection of resource records stored by a host are stored in zone files.\n" +
            "Every domain that a host knows about is stored in a zone file, and it is these\n" +
            "zone files that get distributed across the Internet to form the global\n" +
            "distributed DNS database. A zone file is a simple text file that contains the\n" +
            "mappings between domain names and IP addresses. DNS nameservers use this zone\n" +
            "file to find out which IP address should be contacted when a user requests a\n" +
            "particular domain name.</p>\n" +
            "<p>The zone file contains different classes of DNS records. For our purposes, we\n" +
            "will focus on the <code>IN</code> record class that defines the set of DNS records for the\n" +
            "Internet. All resource records use the following format, regardless of class or\n" +
            "type.</p>\n" +
            "<table>\n" +
            "<thead>\n" +
            "<tr>\n" +
            "<th></th>\n" +
            "<th>host label</th>\n" +
            "<th>ttl</th>\n" +
            "<th>record class</th>\n" +
            "<th>record type</th>\n" +
            "<th>record data</th>\n" +
            "</tr>\n" +
            "</thead>\n" +
            "<tbody>\n" +
            "<tr>\n" +
            "<td>Example</td>\n" +
            "<td>example.com.</td>\n" +
            "<td>60</td>\n" +
            "<td>IN</td>\n" +
            "<td>A</td>\n" +
            "<td>104.255.228.125</td>\n" +
            "</tr>\n" +
            "</tbody>\n" +
            "</table>\n" +
            "<ul>\n" +
            "<li><strong>Host Label</strong>. A host label defines the hostname of a record and whether the\n" +
            "$ORIGIN hostname will be appended to the label. Fully qualified hostnames\n" +
            "terminated by a period will not append the origin.</li>\n" +
            "<li><strong>TTL</strong>. TTL is the amount of time in seconds that a DNS record will be cached\n" +
            "by an outside DNS server or resolver.</li>\n" +
            "<li><strong>Record Class</strong>. There are three classes of DNS records: IN (Internet), CH\n" +
            "(Chaosnet), and HS (Hesiod). The IN class is used by the Internet, the other\n" +
            "classes are used for alternate networks we won’t discuss here.</li>\n" +
            "<li><strong>Record Type</strong>. Defines the syntax and semantics for this record.</li>\n" +
            "<li><strong>Record Data</strong>. The actual data for the record, such as an IP address,\n" +
            "hostname, or other information. Different record types will contain different\n" +
            "types of record data.</li>\n" +
            "</ul>\n" +
            "<h3 id=\"a-and-aaaa-records\">A and AAAA Records</h3>\n" +
            "<p><code>A</code> and <code>AAAA</code> both map a domain to an IP address, with the <code>A</code> record used to\n" +
            "map a host to an IPv4 IP address, and an <code>AAAA</code> record used to map a host to an\n" +
            "IPv6 address.</p>\n" +
            "<p>The general format of these records is this:</p>\n" +
            "<div class=\"highlight\"><pre class=\"chroma\"><code class=\"language-fallback\" data-lang=\"fallback\">sookocheff  IN      A       IPv4_address\n" +
            "sookocheff  IN      AAAA    IPv6_address\n" +
            "</code></pre></div><h3 id=\"cname-records\">CNAME Records</h3>\n" +
            "<p><code>CNAME</code> records define an alias for an <code>A</code> or <code>AAAA</code> record. For instance, we\n" +
            "could have an <code>A</code> name record defining the “sookocheff” host and then use the “www”\n" +
            "as an alias for this host:</p>\n" +
            "<div class=\"highlight\"><pre class=\"chroma\"><code class=\"language-fallback\" data-lang=\"fallback\">sookocheff  IN  A       111.111.111.111\n" +
            "www         IN  CNAME   sookocheff\n" +
            "</code></pre></div><h3 id=\"mx-records\">MX Records</h3>\n" +
            "<p><code>MX</code> records are used to define the mail exchanges used by the domain to route\n" +
            "email messages addressed to this domain to the appropriate mail server. Unlike\n" +
            "many other record types, mail records generally don’t map a host to something,\n" +
            "because they apply to the entire zone. As such, <code>MX</code> records are usually defined\n" +
            "with no host name at the beginning:</p>\n" +
            "<div class=\"highlight\"><pre class=\"chroma\"><code class=\"language-fallback\" data-lang=\"fallback\">        IN  MX  10   mail.sookocheff.com.\n" +
            "</code></pre></div><p>Also note that there is an extra number in the record (<code>10</code>). This is the\n" +
            "preference number that helps computers decide which server to send mail to if\n" +
            "there are multiple mail servers defined. Lower numbers have a higher priority.</p>\n" +
            "<h3 id=\"ns-records\">NS Records</h3>\n" +
            "<p>This record type defines the name servers that are used for this zone.</p>\n" +
            "<p>You may be wondering, “if a namserver manages the zone file, why do we need to\n" +
            "specify a nameserver in the zone file?”. To answer this, we need to think about\n" +
            "what makes DNS so successful – it’s distributed database with multiple levels\n" +
            "of caching. Fefining nameservers within the zone file is necessary because the\n" +
            "zone file may be served from a cached or slave copy of the file on another name\n" +
            "server. In this case, you need to reference the master nameserver in the zone file in cases where your cache is old or out of date.</p>\n" +
            "<p>Like the <code>MX</code> records, these are zone-wide parameters, so they do not specify\n" +
            "hosts. <code>NS</code> records look like:</p>\n" +
            "<div class=\"highlight\"><pre class=\"chroma\"><code class=\"language-fallback\" data-lang=\"fallback\">        IN  NS     ns1.sookocheff.com.\n" +
            "        IN  NS     ns2.sookocheff.com.\n" +
            "</code></pre></div><h3 id=\"an-example-zone-file\">An Example Zone File</h3>\n" +
            "<p>The following file provides a full example of a zone file</p>\n" +
            "<div class=\"highlight\"><pre class=\"chroma\"><code class=\"language-fallback\" data-lang=\"fallback\">$ORIGIN sookocheff.com.\n" +
            "@                      3600 SOA   ns1.p30.dynect.net. (\n" +
            "                              zone-admin.dyndns.com.     ; address of responsible party\n" +
            "                              2016072701                 ; serial number\n" +
            "                              3600                       ; refresh period\n" +
            "                              600                        ; retry period\n" +
            "                              604800                     ; expire time\n" +
            "                              1800                     ) ; minimum ttl\n" +
            "                      86400 NS    ns1.p30.dynect.net.\n" +
            "                      86400 NS    ns2.p30.dynect.net.\n" +
            "                      86400 NS    ns3.p30.dynect.net.\n" +
            "                      86400 NS    ns4.p30.dynect.net.\n" +
            "                       3600 MX    10 mail.example.com.\n" +
            "                       3600 MX    20 vpn.example.com.\n" +
            "                       3600 MX    30 mail.example.com.\n" +
            "                         60 A     204.13.248.106\n" +
            "                       3600 TXT   \"v=spf1 includespf.dynect.net ~all\"\n" +
            "mail                  14400 A     204.13.248.106\n" +
            "vpn                      60 A     216.146.45.240\n" +
            "webapp                   60 A     216.146.46.10\n" +
            "webapp                   60 A     216.146.46.11\n" +
            "www                   43200 CNAME example.com.\n" +
            "</code></pre></div><p>In a zone file, <code>$ORIGIN</code> indicates a node in the DNS domain namespace tree. Any\n" +
            "labels below the origin will append the origin hostname to assemble a fully\n" +
            "qualified hostname. Any label within a record that uses a fully qualified domain\n" +
            "terminating with an ending period will not append the origin hostname. For\n" +
            "example, by stating <code>$ORIGIN sookocheff.com.</code>, any record where the host label field is\n" +
            "not followed by a period will have <code>sookocheff.com.</code> will be appended to them.\n" +
            "This means that the label <code>mail</code> will be interpreted as <code>mail.sookocheff.com.</code>.</p>\n" +
            "<p>The <code>@</code> symbol is a special label that is simply a short-hand for <code>$ORIGIN</code>.\n" +
            "During resolution, the <code>@</code> symbol will be replaced by <code>example.com.</code>.</p>\n" +
            "<p>The <code>$ORIGIN</code> is followed by the zone’s Start Of Authority (<code>SOA</code>) record. A\n" +
            "Start Of Authority record is required for each zone. It starts with the primary\n" +
            "nameserver of the zone, and is followed by a block of metadata including the\n" +
            "e-mail address of the party responsible for administering the domain’s zone\n" +
            "file, the current serial number of the zone which should be modified whenever\n" +
            "data in the zone file changes, and various timing elements for caching, refresh,\n" +
            "and retry.</p>\n" +
            "<p>After the <code>SOA</code> portion of the zone file come the resource records this\n" +
            "nameserver knows about defined using the resource types listed in the previous\n" +
            "section.</p>\n" +
            "<h2 id=\"nameservers-and-zones\">Nameservers and Zones</h2>\n" +
            "<p>Each domain namespace is served by a program called a <em>nameserver</em>. Nameservers\n" +
            "generally have complete information about some part of the domain namespace,\n" +
            "called a <em>zone</em>. The nameserver with this complete information is called the\n" +
            "<em>authority</em> for that zone.</p>\n" +
            "<p>The difference between a namespace and a zone is subtle but important. Whereas a\n" +
            "domain is the strict labeling of a portion of the namespace, each domain can be\n" +
            "broken up into smaller units called zones by delegation. For example, the <code>.ca</code>\n" +
            "domain for Canada can be broken up into different zones for each province:\n" +
            "<code>gc.ca</code>, <code>ab.ca</code>, <code>on.ca</code>, and so on. Each of these provincial zones can be\n" +
            "administered by the provinces using authoratitive nameservers, while the <code>.ca</code>\n" +
            "zone would contain the delegation information pointing to the nameservers of\n" +
            "each of the delegated provincial zones. The <code>.ca</code> zone does not <em>have</em> to\n" +
            "delegate. In some cases, the top-level zone may be the authoritative nameserver\n" +
            "for some of the lower-level zones. The following figure, from the 5th Edition of\n" +
            "<a href=\"http://shop.oreilly.com/product/9780596100575.do\">DNS and BIND</a> shows an\n" +
            "example division of the <code>.ca</code> domain into multiple zones where some of the zones\n" +
            "are delegated to provinces and others are handled by the root <code>.ca</code> zone.</p>\n" +
            "\n" +
            "\n" +
            "<div class=\"box\">\n" +
            "  <figure itemprop=\"associatedMedia\" itemscope=\"\" itemtype=\"http://schema.org/ImageObject\">\n" +
            "    <div class=\"img\">\n" +
            "      <img itemprop=\"thumbnail\" src=\"assets/ca-zones.png\" alt=\"assets/ca-zones.png\">\n" +
            "    </div>\n" +
            "    <a href=\"assets/ca-zones.png\" itemprop=\"contentUrl\"></a>\n" +
            "      <figcaption><h4>Sample zones for the .ca domain</h4>\n" +
            "      </figcaption>\n" +
            "  </figure>\n" +
            "</div>\n" +
            "\n" +
            "<p>There are two types of nameservers in DNS: <em>master</em> (*or <em>primary</em>) servers that\n" +
            "read zone data from a datafile on the host, and <em>slave</em> (or <em>secondary</em>) servers\n" +
            "that read zone data from master or other slave servers. Whenever slave servers\n" +
            "start-up, and periodically afterwards, they contact their master server to fetch\n" +
            "updated data for their zone. The master server and any secondaries are all\n" +
            "considered authoritative for a zone. The data on the servers are simply the\n" +
            "resource records that describe the zone stored in a zone file. These records\n" +
            "describe all the hosts in the zone and record any delegation points that direct\n" +
            "to subdomains.</p>\n" +
            "<h2 id=\"resolvers\">Resolvers</h2>\n" +
            "<p>DNS <em>resolvers</em> are the clients that query for DNS information from a\n" +
            "nameserver. These programs run on a host to query a DNS nameserver, interpret\n" +
            "the response, and return the information to the programs that request it. In\n" +
            "DNS, the resolver implements the recursive query algorithm that traverses the\n" +
            "inverted namespace tree until it finds the result for a query (or an error).</p>\n" +
            "<p>Resolvers are only useful when doing DNS resolution, which we cover next.</p>\n" +
            "<h2 id=\"resolution-putting-it-all-together\">Resolution: Putting it all Together</h2>\n" +
            "<p>As we’ve discussed, the domain namespace is structured as an inverted tree. This\n" +
            "structure allows a nameserver to use a single piece of information — the\n" +
            "location of the root nameservers — to find any other domain in the tree.</p>\n" +
            "<p>The root nameservers are the authoritative nameservers for all top-level\n" +
            "domains. That is, given a query about any domain name, the root nameservers can\n" +
            "provide the names and addresses of the authoritative nameservers for the\n" +
            "top-level domains. In turn, the top-level nameservers can provide the list of\n" +
            "authoritative nameservers for the second-level domains, and so on. In this\n" +
            "recursive fashion, every time a nameserver is queried, it will either return the\n" +
            "data for the domains it is authoritative for, or it will return information that\n" +
            "is closer to the correct answer.</p>\n" +
            "<p>The following diagram from <a href=\"https://aws.amazon.com/route53/what-is-dns/\">Amazon’s Route 53\n" +
            "documentation</a> gives an overview of\n" +
            "how recursive and authoritative DNS services work together to route an end user\n" +
            "to your website or application.</p>\n" +
            "\n" +
            "\n" +
            "<div class=\"box\">\n" +
            "  <figure itemprop=\"associatedMedia\" itemscope=\"\" itemtype=\"http://schema.org/ImageObject\">\n" +
            "    <div class=\"img\">\n" +
            "      <img itemprop=\"thumbnail\" src=\"assets/dns-resolution.png\" alt=\"assets/dns-resolution.png\">\n" +
            "    </div>\n" +
            "    <a href=\"assets/dns-resolution.png\" itemprop=\"contentUrl\"></a>\n" +
            "      <figcaption><h4>An example DNS resolution</h4>\n" +
            "      </figcaption>\n" +
            "  </figure>\n" +
            "</div>\n" +
            "\n" +
            "<ol>\n" +
            "<li>A user opens a web browser, enters <a href=\"http://www.example.com\">www.example.com</a> in the address bar, and\n" +
            "presses Enter.</li>\n" +
            "<li>The request for <a href=\"http://www.example.com\">www.example.com</a> is routed to a DNS resolver, which is\n" +
            "typically managed by the user’s Internet service provider (ISP), such as a\n" +
            "cable Internet provider, a DSL broadband provider, or a corporate network.</li>\n" +
            "<li>The DNS resolver for the ISP forwards the request for <a href=\"http://www.example.com\">www.example.com</a> to a\n" +
            "DNS root name server. The root name server responds with the authoritative\n" +
            "namerservers for the .com top-level domain (TLD)aut</li>\n" +
            "<li>The DNS resolver for the ISP forwards the request for <a href=\"http://www.example.com\">www.example.com</a> again,\n" +
            "this time to one of the TLD name servers for .com domains. The name server\n" +
            "for .com domains responds to the request with the names of the nameservers\n" +
            "that are associated with the example.com domain. In this example, those\n" +
            "nameservers are implemented using Amazon Route 53.</li>\n" +
            "<li>The DNS resolver for the ISP chooses an Amazon Route 53 name server and\n" +
            "forwards the request for <a href=\"http://www.example.com\">www.example.com</a> to that name server.</li>\n" +
            "<li>The Amazon Route 53 name server looks in the example.com hosted zone datafile\n" +
            "for the <a href=\"http://www.example.com\">www.example.com</a> record, gets the associated value, such as the IP\n" +
            "address for a web server, 192.0.2.44, and returns the IP address to the DNS\n" +
            "resolver.</li>\n" +
            "<li>The DNS resolver for the ISP finally has the IP address that the user needs.\n" +
            "The resolver returns that value to the web browser. The DNS resolver also\n" +
            "caches (stores) the IP address for example.com so that it can respond more\n" +
            "quickly the next time someone browses to example.com.</li>\n" +
            "<li>The web browser sends a request to the IP address that it got from the DNS\n" +
            "resolver.</li>\n" +
            "<li>The web server or other resource at 192.0.2.44 returns the web page for\n" +
            "<a href=\"http://www.example.com\">www.example.com</a> to the web browser, and the web browser displays the page.</li>\n" +
            "</ol>\n" +
            "<p>The example resolution we’ve used to convert the <code>www.example.com</code> domain into\n" +
            "the <code>192.0.2.44</code> IP address is fairly convoluted. To improve access speeds,\n" +
            "namservers typically cache query results to help speed up successive queries.</p>\n" +
            "<h2 id=\"references\">References</h2>\n" +
            "<p>This article provides an introduction to DNS. If you want to learn more, there\n" +
            "are several great resources to choose from:</p>\n" +
            "<ul>\n" +
            "<li><a href=\"https://aws.amazon.com/route53/what-is-dns/\">What is DNS?</a></li>\n" +
            "<li><a href=\"http://shop.oreilly.com/product/9780596100575.do\">DNS and BIND, 5th Edition</a></li>\n" +
            "<li><a href=\"https://www.digitalocean.com/community/tutorials/an-introduction-to-dns-terminology-components-and-concepts\">An Introduction to DNS Terminology, Components, and Concepts</a></li>\n" +
            "<li><a href=\"https://tools.ietf.org/html/rfc1035\">RFC 1035 Domain Names - Implementation and Specification</a></li>\n" +
            "</ul>\n" +
            "\n" +
            "\n" +
            "        \n" +
            "          <div class=\"blog-tags\">\n" +
            "            \n" +
            "              <a href=\"https://sookocheff.com/tags/networking/\">networking</a>&nbsp;\n" +
            "            \n" +
            "              <a href=\"https://sookocheff.com/tags/dns/\">dns</a>&nbsp;\n" +
            "            \n" +
            "          </div>\n" +
            "        \n" +
            "\n" +
            "        \n" +
            "\n" +
            "        \n" +
            "          \n" +
            "            \n" +
            "          \n" +
            "\n" +
            "          \n" +
            "                  <h4 class=\"see-also\">See also</h4>\n" +
            "                  <ul>\n" +
            "                \n" +
            "                \n" +
            "                    <li><a href=\"/post/networking/how-does-web-rtc-work/\">How Does WebRTC Work?</a></li>\n" +
            "                \n" +
            "                    <li><a href=\"/post/networking/how-does-lte-work/\">How Does LTE Work?</a></li>\n" +
            "                \n" +
            "                    <li><a href=\"/post/networking/how-does-wifi-work/\">How Does WiFi Work?</a></li>\n" +
            "                \n" +
            "                    <li><a href=\"/post/networking/how-does-ethernet-work/\">How Does Ethernet Work?</a></li>\n" +
            "                \n" +
            "                    <li><a href=\"/post/networking/wireless-networks-and-shannons-law/\">Wireless Networks and Shannon’s Law</a></li>\n" +
            "                \n" +
            "              </ul>\n" +
            "\n" +
            "          \n" +
            "        \n" +
            "      </article>\n" +
            "\n" +
            "      \n" +
            "        <ul class=\"pager blog-pager\">\n" +
            "          \n" +
            "            <li class=\"previous\">\n" +
            "              <a href=\"https://sookocheff.com/post/architecture/building-learning-communities/\" data-toggle=\"tooltip\" data-placement=\"top\" title=\"Building Learning Communities\">← Previous Post</a>\n" +
            "            </li>\n" +
            "          \n" +
            "          \n" +
            "            <li class=\"next\">\n" +
            "              <a href=\"https://sookocheff.com/post/systems/above-the-line-below-the-line/\" data-toggle=\"tooltip\" data-placement=\"top\" title=\"Above-the-line and below-the-line\">Next Post →</a>\n" +
            "            </li>\n" +
            "          \n" +
            "        </ul>\n" +
            "      \n" +
            "\n" +
            "\n" +
            "      \n" +
            "        \n" +
            "          \n" +
            "          <div class=\"disqus-comments\">\n" +
            "            <div id=\"disqus_thread\"></div>\n" +
            "<script type=\"application/javascript\">\n" +
            "    var disqus_config = function () {\n" +
            "    \n" +
            "    \n" +
            "    \n" +
            "    };\n" +
            "    (function() {\n" +
            "        if ([\"localhost\", \"127.0.0.1\"].indexOf(window.location.hostname) != -1) {\n" +
            "            document.getElementById('disqus_thread').innerHTML = 'Disqus comments not available by default when the website is previewed locally.';\n" +
            "            return;\n" +
            "        }\n" +
            "        var d = document, s = d.createElement('script'); s.async = true;\n" +
            "        s.src = '//' + \"kevinsookocheff\" + '.disqus.com/embed.js';\n" +
            "        s.setAttribute('data-timestamp', +new Date());\n" +
            "        (d.head || d.body).appendChild(s);\n" +
            "    })();\n" +
            "</script>\n" +
            "<noscript>Please enable JavaScript to view the <a href=\"https://disqus.com/?ref_noscript\">comments powered by Disqus.</a></noscript>\n" +
            "<a href=\"https://disqus.com\" class=\"dsq-brlink\">comments powered by <span class=\"logo-disqus\">Disqus</span></a>\n" +
            "          </div>\n" +
            "          \n" +
            "        \n" +
            "        \n" +
            "      \n" +
            "\n" +
            "    </div>\n" +
            "  </div>\n" +
            "</div>\n" +
            "\n" +
            "      \n" +
            "<footer>\n" +
            "  <div class=\"container\">\n" +
            "    <div class=\"row\">\n" +
            "      <div class=\"col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1\">\n" +
            "        <ul class=\"list-inline text-center footer-links\">\n" +
            "          \n" +
            "              <li>\n" +
            "                <a href=\"mailto:kevin@sookocheff.com\" title=\"Email me\">\n" +
            "                  <span class=\"fa-stack fa-lg\">\n" +
            "                    <i class=\"fas fa-circle fa-stack-2x\"></i>\n" +
            "                    <i class=\"fas fa-envelope fa-stack-1x fa-inverse\"></i>\n" +
            "                  </span>\n" +
            "                </a>\n" +
            "              </li>\n" +
            "              <li>\n" +
            "                <a href=\"https://www.facebook.com/soofaloofa\" title=\"Facebook\">\n" +
            "                  <span class=\"fa-stack fa-lg\">\n" +
            "                    <i class=\"fas fa-circle fa-stack-2x\"></i>\n" +
            "                    <i class=\"fab fa-facebook fa-stack-1x fa-inverse\"></i>\n" +
            "                  </span>\n" +
            "                </a>\n" +
            "              </li>\n" +
            "              <li>\n" +
            "                <a href=\"https://github.com/soofaloofa\" title=\"GitHub\">\n" +
            "                  <span class=\"fa-stack fa-lg\">\n" +
            "                    <i class=\"fas fa-circle fa-stack-2x\"></i>\n" +
            "                    <i class=\"fab fa-github fa-stack-1x fa-inverse\"></i>\n" +
            "                  </span>\n" +
            "                </a>\n" +
            "              </li>\n" +
            "              <li>\n" +
            "                <a href=\"https://twitter.com/soofaloofa\" title=\"Twitter\">\n" +
            "                  <span class=\"fa-stack fa-lg\">\n" +
            "                    <i class=\"fas fa-circle fa-stack-2x\"></i>\n" +
            "                    <i class=\"fab fa-twitter fa-stack-1x fa-inverse\"></i>\n" +
            "                  </span>\n" +
            "                </a>\n" +
            "              </li>\n" +
            "              <li>\n" +
            "                <a href=\"https://linkedin.com/in/kevinsookocheff\" title=\"LinkedIn\">\n" +
            "                  <span class=\"fa-stack fa-lg\">\n" +
            "                    <i class=\"fas fa-circle fa-stack-2x\"></i>\n" +
            "                    <i class=\"fab fa-linkedin fa-stack-1x fa-inverse\"></i>\n" +
            "                  </span>\n" +
            "                </a>\n" +
            "              </li>\n" +
            "              <li>\n" +
            "                <a href=\"https://paypal.me/paypal.me/soofaloofa\" title=\"PayPal\">\n" +
            "                  <span class=\"fa-stack fa-lg\">\n" +
            "                    <i class=\"fas fa-circle fa-stack-2x\"></i>\n" +
            "                    <i class=\"fab fa-paypal fa-stack-1x fa-inverse\"></i>\n" +
            "                  </span>\n" +
            "                </a>\n" +
            "              </li>\n" +
            "          \n" +
            "          <li>\n" +
            "            <a href=\"\" title=\"RSS\">\n" +
            "              <span class=\"fa-stack fa-lg\">\n" +
            "                <i class=\"fas fa-circle fa-stack-2x\"></i>\n" +
            "                <i class=\"fas fa-rss fa-stack-1x fa-inverse\"></i>\n" +
            "              </span>\n" +
            "            </a>\n" +
            "          </li>\n" +
            "          \n" +
            "        </ul>\n" +
            "        <p class=\"credits copyright text-muted\">\n" +
            "          \n" +
            "            \n" +
            "              Kevin Sookocheff\n" +
            "            \n" +
            "          \n" +
            "\n" +
            "          &nbsp;•&nbsp;©\n" +
            "          \n" +
            "            2020\n" +
            "          \n" +
            "\n" +
            "          \n" +
            "            &nbsp;•&nbsp;\n" +
            "            <a href=\"https://sookocheff.com\">Kevin Sookocheff</a>\n" +
            "          \n" +
            "        </p>\n" +
            "        \n" +
            "        <p class=\"credits theme-by text-muted\">\n" +
            "          <a href=\"https://gohugo.io\">Hugo v0.68.2</a> powered &nbsp;•&nbsp; Theme <a href=\"https://github.com/halogenica/beautifulhugo\">Beautiful Hugo</a> adapted from <a href=\"https://deanattali.com/beautiful-jekyll/\">Beautiful Jekyll</a>\n" +
            "          \n" +
            "        </p>\n" +
            "      </div>\n" +
            "    </div>\n" +
            "  </div>\n" +
            "</footer><script src=\"https://sookocheff.com/js/katex.min.js\"></script>\n" +
            "<script src=\"https://sookocheff.com/js/auto-render.min.js\"></script>\n" +
            "<script src=\"https://sookocheff.com/js/jquery.min.js\"></script>\n" +
            "<script src=\"https://sookocheff.com/js/bootstrap.min.js\"></script>\n" +
            "\n" +
            "<script src=\"https://sookocheff.com/js/main.js\"></script><script> renderMathInElement(document.body); </script><script src=\"https://sookocheff.com/js/photoswipe.min.js\"></script>\n" +
            "<script src=\"https://sookocheff.com/js/photoswipe-ui-default.min.js\"></script><script src=\"https://sookocheff.com/js/load-photoswipe.js\"></script>";
    }
    let s2="<div><div><ol><li>fuck</li><li><a href='/www/aaa.html'>fuck a</a></li></ol></div></div>"

    let r=await simply2(gets3())


    console.log(r)
    console.log("done")
}

// (async ()=>{
//    await test();
// })()

