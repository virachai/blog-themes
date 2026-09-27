/* MeeFun staging theme scripts, moved out of 01-theme-staging.xml so they can be read, diffed and debugged here.
 Loaded with defer from <head>: runs after the document is parsed, before DOMContentLoaded and load, in the original order below. */

/* ---------- head: meta description fallback (was XML lines 106-116) ---------- */
  (() => {
    if (document.querySelector("meta[name='description']")) return;
    const desc = document.querySelector("meta[property='og:description']");
    if (!desc) return;
    let clone = desc.cloneNode(true);
    clone.setAttribute("name", "description");
    clone.removeAttribute("property");
    document.querySelector("head").appendChild(clone);
  })();


/* ---------- HTML1 widget "JS101" (was XML lines 2842-2935) ---------- */
window.addEventListener("load", () => {

const heroUpdate = () => {
    try {
        const bd = document.querySelector('body');
        const bodyWidth = bd.offsetWidth;
        const scrWidth = screen.width;
        const diffWidth = Math.abs(bodyWidth - scrWidth);
        const elmHero = document.querySelector(".hero-image");
        elmHero.classList.add("hero-image-mobile");
        if(diffWidth > 10) elmHero.classList.remove("hero-image-mobile");
    }
    catch(err) {console.log(err);}
}
heroUpdate();

const menu = document.querySelector(".svg-icon-24-button.hamburger-menu");
//console.log(menu);
menu.setAttribute("id","hamburgerMenuId");
menu.setAttribute("aria-label","hamburgerMenuName");

if(!document.querySelector('.page_body h3.post-title.entry-title a')){
let pstitle = document.querySelector('.page_body h3.post-title.entry-title');
if(pstitle) pstitle.outerHTML = '<h2 class="post-title entry-title">' + pstitle.innerHTML + '</h2>';
}
});
                    
// 2024-01-17             
const heroGetpinned = () => {
    try {
        const heroSticky = document.querySelector('.hero-sticky-pinned');
        if(!heroSticky) return;        
		const observer = new IntersectionObserver( 
        	([e]) => document.querySelector('#HTML3').classList.toggle("set-sticky", e.intersectionRatio < 1),{ threshold: [1] }
        );
		observer.observe(heroSticky);	
    }
    catch(err) {console.log(err);}
}
heroGetpinned();

const tocGetpinned = () => {
    try {
		const tocSticky = document.querySelector('#toc_sticky');
        if(!tocSticky) return;

		let callback = (entries, observer) => {
			const rect = tocSticky.getBoundingClientRect();

 			if(rect.top.toFixed()*1 > 0){
				document.querySelector('#HTML5').classList.add("on-sticky");
				document.querySelector('#HTML5').classList.toggle("on-sticky");
				return;
			}
			document.querySelector('#HTML5').classList.toggle("on-sticky");
		};

		const observer = new IntersectionObserver(callback, { threshold: [1] });

		observer.observe(tocSticky);
        
    }
    catch(err) {console.log(err);}
}
tocGetpinned();

const buttonGetpinned = () => {
    try {
		const tocSticky = document.querySelector('#HTML7');
        if(!tocSticky) return;
    
 		const rect = tocSticky.getBoundingClientRect();
		let callback = (entries, observer) => {
			const rect = tocSticky.getBoundingClientRect();
			//console.log(rect.top.toFixed());
 			if(rect.top.toFixed()*1 > 0){
				document.querySelector('#HTML6').classList.add("on-sticky");
				document.querySelector('#HTML6').classList.toggle("on-sticky");
				return;
			}
			document.querySelector('#HTML6').classList.toggle("on-sticky");
		};

		const observer = new IntersectionObserver(callback, { threshold: [1] });

		observer.observe(tocSticky);
        
    }
    catch(err) {console.log(err);}
}
buttonGetpinned();


/* ---------- end of <body> (was XML lines 3690-3909) ---------- */
const hamburger = document.querySelector(".hamburger-menu")
if(hamburger !== null){
  
  hamburger.addEventListener("click", function() {
  	document.querySelector("aside").classList.toggle("sidebar-invisible");
  	document.querySelector("body").classList.toggle("sidebar-visible"); 
  	document.querySelector("aside").classList.toggle("sidebar-visible");
  	document.querySelector("#subscribe-dim-overlay").classList.toggle("hidden");
  	document.querySelector(".header-widget").classList.toggle("hidden");
  document.querySelector("div.centered-top").classList.toggle("hidden");
  //centered-top
  });
}
  
const hiddenOverlay = document.querySelector("#subscribe-dim-overlay")
if(hiddenOverlay !== null){
  hiddenOverlay.addEventListener("click", function() {
  	hamburger.click();
  });
}
  
const sidebarBack = document.querySelector(".sidebar-back");
if(sidebarBack !== null){
  sidebarBack.addEventListener("click", function() {
  	hamburger.click();
  });
}  

const searchBt = document.querySelector("button.touch-icon-button");
const searchSection = document.querySelector("div.search");
if(searchBt !== null){
  searchBt.addEventListener("click", function() {
  	if(searchSection !== null) searchSection.classList.add("focused");
  });
}

//page_body
const pageBody = document.querySelector("button.search-cancel");
if(pageBody !== null){
  pageBody.addEventListener("click", function() {
  	if(searchSection !== null) searchSection.classList.remove("focused");
  });
}

//window.addEventListener('DOMContentLoaded', (event) => {
//console.log('DOM fully loaded and parsed');
//});
const tocBtnShow = () => {  
  const elmTocBtn = document.querySelector("a.float-button.show_toc_section");
  if(!elmTocBtn) return;
  
  //if(!elmTocBtnClose) return;
  
  const handleclick = (event) => {

  	const tocBottomContainer = document.querySelector(".toc-bottom-container");
  	if(tocBottomContainer) {
 		tocBottomContainer.classList.add("section-display-m");
  		//console.log(event.target.closest("div.float-button-link"));
  		if(event.target.closest("div.float-button-link")) {
  			const elmTocBtnClose = document.querySelector("#HTML6 .toc-bottom-container.section-display-m .close-button button");
  			elmTocBtnClose.onclick = handleclick; 
  			//console.log(elmTocBtnClose);
  		}
  	};
  	
  	if(event.target.closest(".close-button")) {
  		tocBottomContainer.classList.add("section-display-m");
  		if( event.target.closest(".close-button") ) { 
  			tocBottomContainer.classList.remove("section-display-m");
  		}
  	}
  	//alert(event.target.tagName);
  	event.preventDefault();
  }
  
  if (typeof window.addEventListener != "undefined") {
    elmTocBtn.addEventListener("click", handleclick, false);
  	//elmTocBtnClose.addEventListener("click", handleclick, false);
  } else {
  	elmTocBtn.attachEvent("onclick", handleclick);
  	//elmTocBtnClose.attachEvent("onclick", handleclick);
  }
  
  //Copy Toc to Element
  (() => {
  	const toc_list = document.querySelector("#toc_container > ul") || document.querySelector("#toc_container > ol") || false;
  	
  	if(!toc_list) return;
  
    let cloneR = toc_list.cloneNode(true);
  	let cloneB = toc_list.cloneNode(true);
    
  	const toc_right = document.querySelector("#HTML5 .widget-content");
  	
  	if(!toc_right) return;
  
  	toc_right.innerHTML = "";
  	toc_right.appendChild(cloneR);
  	//console.log(clone);
  
  	const toc_bottom = document.querySelector("#HTML6 .toc-bottom-list");
  	if(!toc_bottom) return;
  	toc_bottom.innerHTML = "";
  	toc_bottom.appendChild(cloneB);
  })()
}

window.onload = (event) => {

//actionNewsByNo();
//viewLottoNews(); 
autoGenTocv11();
tocBtnShow();
  
const thumbnailImg = document.querySelectorAll('.post-body .snippet-thumbnail img');
if(1)
if(thumbnailImg !== null){
  thumbnailImg.forEach(element => {
  	//const pw = element.parentElement.clientWidth + 'px';
  	//const ph = element.parentElement.clientHeight + 'px';
  	//element.setAttribute('width', pw);
  	//element.setAttribute('height', ph);
    element.setAttribute('width', '100%');
    element.setAttribute('height', '100%');
  	//parentElement
  	element.setAttribute('loading', 'lazy');
  	element.setAttribute('class', 'lazy');
  	//element.setAttribute('srcset', `${element.src.replace('w512-h288', 'w360-h203')} 370w, ${element.src} 2560w`);
  	//element.setAttribute('srcset', `${element.src.replace('w460-h260', 'w360-h203').replace('w512-h288', 'w360-h203')} 370w, ${element.src} 2560w`);
  });
}


document.querySelector("#subscribe-dim-overlay").style = '';
document.querySelector('.header-image-wrapper img').setAttribute("height", "34.8");
document.querySelector('.header-image-wrapper img').setAttribute("width", "40");

};
  
function autoGenTocv11() {
  const toc = document.querySelector("#toc_container");
  if (!toc) return;

  const tocH2 = toc.querySelector("h2");
  if (!tocH2) return;

  // Create an empty unordered list for the TOC
  const tocList = document.createElement("ol");
  tocList.setAttribute("id", "toc_ol");

  let headings = toc.nextElementSibling;
  const h2list = [];

  let h2no = 0;
  let h3no = 0;
  let subList = null;
  // Loop through each heading
  while (headings) {
    let tag = headings.nodeName;
    if (tag != "H2" && tag != "H3") {
      headings = headings.nextElementSibling;
      continue;
    }   
    
    if (tag == "H2"){ 
      h3no = 0;
      h2no++;
    } else if (tag == "H3"){ 
      h3no++;    
    }
    
    let idElem = headings.getAttribute("id") || `toc_${h2no}_${h3no}`;
    if(!idElem) return;
  
    headings.setAttribute("id", idElem);

    item = document.createElement("li");        
    link = document.createElement("a");
    link.textContent = headings.getAttribute("title") || headings.textContent || idElem;
    link.setAttribute("href", "#" + idElem);
    item.appendChild(link);

    if(tag == "H3") {
      !subList && (subList = document.createElement("ul"));
      subList.appendChild(item);
      if(h2list) {
        let temp = h2list.pop();
        if(temp.length > 1) {
          temp.removeChild(temp.children[1]);
        }
        temp.appendChild(subList);
        h2list.push(temp);
      }
    }
    if (tag == "H2"){
      h2list.push(item);
      subList = null;
    }
    
    previousSibling = headings;
    headings = headings.nextElementSibling;
  }
  
  const tocOl = toc.querySelector("ol");
  if (tocOl != null) return;
 
  const tocUl = toc.querySelector("ul");
  if (tocUl != null) return;
  
  h2list.forEach((itm) => {
    tocList.appendChild(itm);
  });

  if (tocH2 && tocH2.parentNode) {
    tocH2.parentNode.insertBefore(tocList, tocH2.nextSibling);
  }
}

/* ---------- Thai UI labels (template strings the XML still carries) ---------- */
(() => {
  document.querySelectorAll('.post-author-label').forEach(e => { if (/Written By/i.test(e.textContent)) e.textContent = 'โดย '; });
  document.querySelectorAll('a, span').forEach(e => { if (e.children.length === 0 && /^\s*Show 9\+ more\s*$/.test(e.textContent)) e.textContent = 'ดูทั้งหมด'; });
  document.querySelectorAll('.Attribution .copyright, .copyright').forEach(e => { e.textContent = e.textContent.replace(/20\d\d/, String(new Date().getFullYear())); });
})();

/* ---------- Static pages (/p/...): mark the body so CSS can drop post-only details ---------- */
if (location.pathname.startsWith('/p/')) document.body.classList.add('page-view');

/* ---------- Send-prompt form (/p/form.html): validate, then post to Google Forms via a hidden iframe ---------- */
(() => {
  const form = document.getElementById('mp-prompt-form');
  if (!form) return;
  const $ = id => document.getElementById(id);
  const phone = $('mp-form-phone'), prompt = $('mp-form-prompt'), mode = $('mp-form-mode'), count = $('mp-form-count');
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
  const show = (el, on) => { el.hidden = !on; };
  const syncCount = () => { count.textContent = prompt.value.length + ' / 1000'; };
  const syncMode = () => { $('mp-form-mode-text').textContent = mode.checked ? 'รับบริจาคและขาย' : 'รับบริจาคเท่านั้น'; };
  prompt.addEventListener('input', syncCount);
  mode.addEventListener('change', syncMode);
  phone.addEventListener('input', () => { phone.value = phone.value.replace(/\D/g, '').slice(0, 10); });
  form.addEventListener('reset', () => setTimeout(() => { syncCount(); syncMode(); show($('mp-form-phone-err'), false); show($('mp-form-prompt-err'), false); }));
  form.addEventListener('submit', e => {
    const phoneOk = /^0\d{9}$/.test(phone.value.trim());
    const promptOk = prompt.value.trim().length > 0;
    show($('mp-form-phone-err'), !phoneOk);
    show($('mp-form-prompt-err'), !promptOk);
    if (!phoneOk || !promptOk) { e.preventDefault(); (phoneOk ? prompt : phone).focus(); return; }
    $('mp-form-uuid').value = uuid();
    form.querySelector('.mp-form-submit').disabled = true;
    setTimeout(() => { form.hidden = true; show($('mp-form-done'), true); $('mp-form-done').scrollIntoView({ block: 'center' }); }, 800);
  });
})();

/* ---------- Post IDs (see docs/04-content/04-01-post-protocol.md) ----------
   A post carries its ID as <div class="mp-id" data-id="0001"></div> in the body (legacy: "Title #0001").
   In a post body, "#0001" becomes a link to that post, with the post's title as link text. */
(() => {
  const TITLE_ID = /\s*#(\d{4})\b/;
  const MARKER_ID = /class="mp-id"[^>]*data-id="(\d{4})"|data-id="(\d{4})"[^>]*class="mp-id"/;
  // Legacy titles with "#0001": show the ID quietly.
  document.querySelectorAll('.post-title, .post-title a').forEach(el => {
    if (el.children.length || !TITLE_ID.test(el.textContent)) return;
    el.innerHTML = el.textContent.replace(TITLE_ID, ' <span class="mp-post-id">#$1</span>');
  });
  const body = document.querySelector('.item-view .post-body');
  if (!body || !/#\d{4}\b/.test(body.textContent)) return;
  const ownMarker = body.querySelector('.mp-id');
  const ownTitle = (document.querySelector('.item-view .post-title') || {}).textContent || '';
  const own = ownMarker ? ownMarker.dataset.id : ((ownTitle.match(TITLE_ID) || [])[1] || '');
  fetch('/feeds/posts/default?alt=json&max-results=150')
    .then(r => r.json())
    .then(j => {
      const map = {};
      (j.feed.entry || []).forEach(e => {
        const link = (e.link || []).find(l => l.rel === 'alternate'); if (!link) return;
        const html = (e.content || e.summary || {}).$t || '';
        const id = (html.match(MARKER_ID) || []).slice(1).find(Boolean) || (e.title.$t.match(TITLE_ID) || [])[1];
        if (id) map[id] = { url: link.href, title: e.title.$t.replace(TITLE_ID, '').trim() };
      });
      const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, {
        acceptNode: n => (/#\d{4}\b/.test(n.nodeValue) && !n.parentElement.closest('a, pre, code, #toc_container')) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
      });
      const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(node => {
        const frag = document.createDocumentFragment(); let last = 0; const text = node.nodeValue;
        text.replace(/#(\d{4})\b/g, (all, id, at) => {
          frag.append(text.slice(last, at)); last = at + all.length;
          const hit = map[id];
          if (hit && id !== own) { const a = document.createElement('a'); a.href = hit.url; a.textContent = hit.title; a.className = 'mp-post-link'; frag.append(a); }
          else frag.append(all);
        });
        frag.append(text.slice(last)); node.replaceWith(frag);
      });
    })
    .catch(() => {});
})();
