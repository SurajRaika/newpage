function getVisibleScreenText() {
  // prefer main content if present
  const root = document.querySelector('main, [role="main"], article, #content, .main') || document.body;

  // walker that accepts non-empty text nodes
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        const tag = p.tagName.toUpperCase();
        // skip script/style/noscript/svg/iframe text
        if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'IFRAME'].includes(tag)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    },
    false
  );

  // check computed styles up the tree and ensure the text node has visible client rects inside viewport
  function isRenderedVisible(node) {
    // style checks for ancestors
    let el = node.parentElement;
    while (el) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
      el = el.parentElement;
    }

    // precise geometry check using Range
    try {
      const range = document.createRange();
      range.selectNodeContents(node);
      const rects = range.getClientRects();
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i];
        if (r.width > 0 && r.height > 0 &&
            r.bottom > 0 && r.top < window.innerHeight &&
            r.right > 0 && r.left < window.innerWidth) {
          return true;
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  const seen = new Set();
  const out = [];
  let n;
  while (n = walker.nextNode()) {
    if (!isRenderedVisible(n)) continue;
    // normalize whitespace into single spaces
    const txt = n.nodeValue.replace(/\s+/g, ' ').trim();
    if (!txt) continue;
    if (!seen.has(txt)) {
      seen.add(txt);
      out.push(txt);
    }
  }

  return out; // array of visible text blocks in page order (deduplicated)
}

// usage example:
const visibleBlocks = getVisibleScreenText();
console.log('Visible text blocks:', visibleBlocks);
console.log('Joined output:\n\n' + visibleBlocks.join('\n\n'));
