/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * DOM-based HTML sanitizer that preserves inline SVG.
 *
 * Angular's built-in sanitizer strips SVG elements, which is the reason this fork
 * exists. This implementation follows the same architecture as Angular's sanitizer
 * (parse into an inert document, walk the tree, keep only allowlisted elements and
 * attributes, validate URL-valued attributes) instead of regex rewriting, which is
 * bypassable (unquoted event handlers, unclosed tags, entity-encoded URLs, etc.).
 *
 * Intentionally NOT allowed: script, style, iframe, object, embed, form, meta,
 * link, base, template, math, foreignObject (mXSS vector), SMIL animation
 * elements (attribute-injection vector, e.g. `<animate attributeName="href">`).
 */
/** HTML elements that are safe to keep (same set Angular's sanitizer allows). */
const HTML_ELEMENTS = 'address,article,aside,blockquote,caption,center,del,details,dialog,dir,div,dl,dd,dt,' +
    'figure,figcaption,footer,h1,h2,h3,h4,h5,h6,header,hgroup,hr,ins,main,map,menu,nav,ol,' +
    'li,ul,pre,section,summary,table,tbody,td,tfoot,th,thead,tr,a,abbr,acronym,audio,b,bdi,' +
    'bdo,big,br,cite,code,em,font,i,img,kbd,label,mark,picture,q,rp,rt,ruby,s,samp,small,' +
    'source,span,strike,strong,sub,sup,time,track,tt,u,var,video';
/** SVG elements that are safe to keep. */
const SVG_ELEMENTS = 'svg,circle,clippath,defs,desc,ellipse,filter,feblend,fecolormatrix,fecomponenttransfer,' +
    'fecomposite,feconvolvematrix,fediffuselighting,fedisplacementmap,fedistantlight,' +
    'fedropshadow,feflood,fefunca,fefuncb,fefuncg,fefuncr,fegaussianblur,femerge,femergenode,' +
    'femorphology,feoffset,fepointlight,fespecularlighting,fespotlight,fetile,feturbulence,' +
    'g,image,line,lineargradient,marker,mask,path,pattern,polygon,polyline,radialgradient,' +
    'rect,stop,switch,symbol,text,textpath,title,tspan,use,view';
/** Attributes whose value is a URL and must match a safe pattern. */
const URL_ATTRIBUTES = 'background,cite,href,longdesc,src,xlink:href,xml:base';
/** Non-URL attributes that are safe to keep (HTML + SVG presentation attributes). */
const SAFE_ATTRIBUTES = 'abbr,accesskey,align,alt,autoplay,axis,bgcolor,border,cellpadding,cellspacing,class,clear,' +
    'color,cols,colspan,compact,controls,coords,datetime,dir,download,face,headers,height,' +
    'hidden,hreflang,hspace,ismap,itemprop,itemscope,lang,language,loop,media,muted,nohref,' +
    'nowrap,open,preload,rel,rev,role,rows,rowspan,rules,scope,scrolling,shape,size,sizes,span,' +
    'srclang,srcset,start,style,summary,tabindex,target,title,translate,type,usemap,valign,' +
    'value,vspace,width,' +
    // SVG presentation and geometry attributes.
    'accent-height,alignment-baseline,baseline-shift,baseprofile,bbox,cap-height,clip,' +
    'clip-path,clip-rule,clippathunits,color-interpolation,color-interpolation-filters,' +
    'color-profile,color-rendering,cursor,cx,cy,d,direction,display,dominant-baseline,dx,dy,' +
    'fill,fill-opacity,fill-rule,filterunits,flood-color,flood-opacity,font-family,font-size,' +
    'font-size-adjust,font-stretch,font-style,font-variant,font-weight,fx,fy,' +
    'glyph-orientation-horizontal,glyph-orientation-vertical,gradienttransform,gradientunits,' +
    'image-rendering,in,in2,k1,k2,k3,k4,kerning,letter-spacing,lighting-color,marker-end,' +
    'marker-mid,marker-start,markerheight,markerunits,markerwidth,mask,maskcontentunits,' +
    'maskunits,mode,offset,opacity,operator,order,orient,overflow,paint-order,pathlength,' +
    'patterncontentunits,patterntransform,patternunits,points,preserveaspectratio,r,radius,' +
    'refx,refy,repeatcount,repeatdur,requiredextensions,requiredfeatures,restart,result,rotate,' +
    'rx,ry,scale,seed,shape-rendering,spreadmethod,startoffset,stddeviation,stop-color,' +
    'stop-opacity,stroke,stroke-dasharray,stroke-dashoffset,stroke-linecap,stroke-linejoin,' +
    'stroke-miterlimit,stroke-opacity,stroke-width,systemlanguage,text-anchor,text-decoration,' +
    'text-rendering,transform,transform-origin,u1,u2,unicode-bidi,vector-effect,version,' +
    'viewbox,visibility,white-space,word-spacing,writing-mode,x,x1,x2,xmlns,xmlns:xlink,' +
    'xml:lang,xml:space,y,y1,y2,zoomandpan';
const toSet = (csv) => new Set(csv.split(','));
const ALLOWED_ELEMENTS = toSet(HTML_ELEMENTS + ',' + SVG_ELEMENTS);
const ALLOWED_ATTRIBUTES = toSet(SAFE_ATTRIBUTES);
const URL_ATTRIBUTE_SET = toSet(URL_ATTRIBUTES);
/**
 * Safe URL pattern (same as Angular's): allows http(s), mailto, ftp, tel, sms
 * and relative URLs; rejects `javascript:`, `vbscript:` and other schemes.
 */
const SAFE_URL_PATTERN = /^(?:(?:https?|mailto|ftp|tel|file|sms):|[^&:/?#]*(?:[/?#]|$))/i;
/** Safe `data:` URL pattern (same as Angular's): base64 image/video/audio only. */
const DATA_URL_PATTERN = /^data:(?:image\/(?:bmp|gif|jpeg|jpg|png|tiff|webp)|video\/(?:mpeg|mp4|ogg|webm)|audio\/(?:mp3|oga|ogg|opus));base64,[a-z0-9+/]+=*$/i;
const isSafeUrl = (value) => {
    const url = value.trim();
    return SAFE_URL_PATTERN.test(url) || DATA_URL_PATTERN.test(url);
};
const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** Parses HTML into an inert document so nothing executes or loads while sanitizing. */
const parseInert = (html) => {
    if (typeof DOMParser !== 'undefined') {
        return new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body;
    }
    if (typeof document !== 'undefined') {
        const inertDocument = document.implementation.createHTMLDocument('sanitization');
        inertDocument.body.innerHTML = html;
        return inertDocument.body;
    }
    return null;
};
const sanitizeAttributes = (element) => {
    const isUseElement = element.nodeName.toLowerCase() === 'use';
    for (const attribute of Array.from(element.attributes)) {
        const name = attribute.name.toLowerCase();
        if (URL_ATTRIBUTE_SET.has(name)) {
            // `<use>` may only reference same-document fragments; external or data:
            // references are a known SVG attack vector.
            const safe = isUseElement
                ? attribute.value.trim().startsWith('#')
                : isSafeUrl(attribute.value);
            if (!safe) {
                element.removeAttribute(attribute.name);
            }
        }
        else if (name.startsWith('on') || !ALLOWED_ATTRIBUTES.has(name)) {
            element.removeAttribute(attribute.name);
        }
    }
};
const sanitizeChildren = (node) => {
    for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === 1 /* ELEMENT_NODE */) {
            const element = child;
            if (!ALLOWED_ELEMENTS.has(element.nodeName.toLowerCase())) {
                // Drop disallowed elements entirely, including their subtree.
                element.remove();
                continue;
            }
            sanitizeAttributes(element);
            sanitizeChildren(element);
        }
        else if (child.nodeType !== 3 /* TEXT_NODE */) {
            // Remove comments, CDATA and processing instructions — all are mXSS vectors.
            child.remove();
        }
    }
};
/** Sanitizes an HTML string while keeping inline `<svg>` content. */
export const sanitizeHtml = (html) => {
    if (!html) {
        return '';
    }
    const body = parseInert(html);
    if (body === null) {
        // No DOM available (e.g. server-side rendering): render as plain text.
        return escapeHtml(html);
    }
    sanitizeChildren(body);
    return body.innerHTML;
};
/** Extracts the plain text of an HTML string (e.g. for ARIA descriptions). */
export const htmlToPlainText = (html) => {
    if (!html) {
        return '';
    }
    const body = parseInert(html);
    return (body === null ? html.replace(/<[^>]*>/g, ' ') : body.textContent || '')
        .replace(/\s+/g, ' ')
        .trim();
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbHRpcC1jdXN0b20tc2FuaXRpemVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21hdGVyaWFsL3Rvb2x0aXAvdG9vbHRpcC1jdXN0b20tc2FuaXRpemVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVIOzs7Ozs7Ozs7Ozs7R0FZRztBQUVILGlGQUFpRjtBQUNqRixNQUFNLGFBQWEsR0FDakIsc0ZBQXNGO0lBQ3RGLHVGQUF1RjtJQUN2Rix3RkFBd0Y7SUFDeEYsc0ZBQXNGO0lBQ3RGLDZEQUE2RCxDQUFDO0FBRWhFLDBDQUEwQztBQUMxQyxNQUFNLFlBQVksR0FDaEIseUZBQXlGO0lBQ3pGLGtGQUFrRjtJQUNsRiwwRkFBMEY7SUFDMUYsd0ZBQXdGO0lBQ3hGLHVGQUF1RjtJQUN2Riw0REFBNEQsQ0FBQztBQUUvRCxxRUFBcUU7QUFDckUsTUFBTSxjQUFjLEdBQUcsdURBQXVELENBQUM7QUFFL0UscUZBQXFGO0FBQ3JGLE1BQU0sZUFBZSxHQUNuQiw0RkFBNEY7SUFDNUYsdUZBQXVGO0lBQ3ZGLHdGQUF3RjtJQUN4Riw0RkFBNEY7SUFDNUYsd0ZBQXdGO0lBQ3hGLHFCQUFxQjtJQUNyQiw0Q0FBNEM7SUFDNUMsbUZBQW1GO0lBQ25GLG9GQUFvRjtJQUNwRix5RkFBeUY7SUFDekYsMEZBQTBGO0lBQzFGLDBFQUEwRTtJQUMxRSwwRkFBMEY7SUFDMUYsc0ZBQXNGO0lBQ3RGLHFGQUFxRjtJQUNyRixzRkFBc0Y7SUFDdEYsd0ZBQXdGO0lBQ3hGLDRGQUE0RjtJQUM1RixvRkFBb0Y7SUFDcEYsd0ZBQXdGO0lBQ3hGLDJGQUEyRjtJQUMzRixxRkFBcUY7SUFDckYscUZBQXFGO0lBQ3JGLHVDQUF1QyxDQUFDO0FBRTFDLE1BQU0sS0FBSyxHQUFHLENBQUMsR0FBVyxFQUFFLEVBQUUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxD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QUFDLENBQUM7QUFFRiw4RUFBOEU7QUFDOUUsTUFBTSxDQUFDLE1BQU0sZUFBZSxHQUFHLENBQUMsSUFBWSxFQUFVLEVBQUU7SUFDdEQsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ1YsT0FBTyxFQUFFLENBQUM7SUFDWixDQUFDO0lBQ0QsTUFBTSxJQUFJLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzlCLE9BQU8sQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsSUFBSSxFQUFFLENBQUM7U0FDNUUsT0FBTyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUM7U0FDcEIsSUFBSSxFQUFFLENBQUM7QUFDWixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLyoqXG4gKiBET00tYmFzZWQgSFRNTCBzYW5pdGl6ZXIgdGhhdCBwcmVzZXJ2ZXMgaW5saW5lIFNWRy5cbiAqXG4gKiBBbmd1bGFyJ3MgYnVpbHQtaW4gc2FuaXRpemVyIHN0cmlwcyBTVkcgZWxlbWVudHMsIHdoaWNoIGlzIHRoZSByZWFzb24gdGhpcyBmb3JrXG4gKiBleGlzdHMuIFRoaXMgaW1wbGVtZW50YXRpb24gZm9sbG93cyB0aGUgc2FtZSBhcmNoaXRlY3R1cmUgYXMgQW5ndWxhcidzIHNhbml0aXplclxuICogKHBhcnNlIGludG8gYW4gaW5lcnQgZG9jdW1lbnQsIHdhbGsgdGhlIHRyZWUsIGtlZXAgb25seSBhbGxvd2xpc3RlZCBlbGVtZW50cyBhbmRcbiAqIGF0dHJpYnV0ZXMsIHZhbGlkYXRlIFVSTC12YWx1ZWQgYXR0cmlidXRlcykgaW5zdGVhZCBvZiByZWdleCByZXdyaXRpbmcsIHdoaWNoIGlzXG4gKiBieXBhc3NhYmxlICh1bnF1b3RlZCBldmVudCBoYW5kbGVycywgdW5jbG9zZWQgdGFncywgZW50aXR5LWVuY29kZWQgVVJMcywgZXRjLikuXG4gKlxuICogSW50ZW50aW9uYWxseSBOT1QgYWxsb3dlZDogc2NyaXB0LCBzdHlsZSwgaWZyYW1lLCBvYmplY3QsIGVtYmVkLCBmb3JtLCBtZXRhLFxuICogbGluaywgYmFzZSwgdGVtcGxhdGUsIG1hdGgsIGZvcmVpZ25PYmplY3QgKG1YU1MgdmVjdG9yKSwgU01JTCBhbmltYXRpb25cbiAqIGVsZW1lbnRzIChhdHRyaWJ1dGUtaW5qZWN0aW9uIHZlY3RvciwgZS5nLiBgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT1cImhyZWZcIj5gKS5cbiAqL1xuXG4vKiogSFRNTCBlbGVtZW50cyB0aGF0IGFyZSBzYWZlIHRvIGtlZXAgKHNhbWUgc2V0IEFuZ3VsYXIncyBzYW5pdGl6ZXIgYWxsb3dzKS4gKi9cbmNvbnN0IEhUTUxfRUxFTUVOVFMgPVxuICAnYWRkcmVzcyxhcnRpY2xlLGFzaWRlLGJsb2NrcXVvdGUsY2FwdGlvbixjZW50ZXIsZGVsLGRldGFpbHMsZGlhbG9nLGRpcixkaXYsZGwsZGQsZHQsJyArXG4gICdmaWd1cmUsZmlnY2FwdGlvbixmb290ZXIsaDEsaDIsaDMsaDQsaDUsaDYsaGVhZGVyLGhncm91cCxocixpbnMsbWFpbixtYXAsbWVudSxuYXYsb2wsJyArXG4gICdsaSx1bCxwcmUsc2VjdGlvbixzdW1tYXJ5LHRhYmxlLHRib2R5LHRkLHRmb290LHRoLHRoZWFkLHRyLGEsYWJicixhY3JvbnltLGF1ZGlvLGIsYmRpLCcgK1xuICAnYmRvLGJpZyxicixjaXRlLGNvZGUsZW0sZm9udCxpLGltZyxrYmQsbGFiZWwsbWFyayxwaWN0dXJlLHEscnAscnQscnVieSxzLHNhbXAsc21hbGwsJyArXG4gICdzb3VyY2Usc3BhbixzdHJpa2Usc3Ryb25nLHN1YixzdXAsdGltZSx0cmFjayx0dCx1LHZhcix2aWRlbyc7XG5cbi8qKiBTVkcgZWxlbWVudHMgdGhhdCBhcmUgc2FmZSB0byBrZWVwLiAqL1xuY29uc3QgU1ZHX0VMRU1FTlRTID1cbiAgJ3N2ZyxjaXJjbGUsY2xpcHBhdGgsZGVmcyxkZXNjLGVsbGlwc2UsZmlsdGVyLGZlYmxlbmQsZmVjb2xvcm1hdHJpeCxmZWNvbXBvbmVudHRyYW5zZmVyLCcgK1xuICAnZmVjb21wb3NpdGUsZmVjb252b2x2ZW1hdHJpeCxmZWRpZmZ1c2VsaWdodGluZyxmZWRpc3BsYWNlbWVudG1hcCxmZWRpc3RhbnRsaWdodCwnICtcbiAgJ2ZlZHJvcHNoYWRvdyxmZWZsb29kLGZlZnVuY2EsZmVmdW5jYixmZWZ1bmNnLGZlZnVuY3IsZmVnYXVzc2lhbmJsdXIsZmVtZXJnZSxmZW1lcmdlbm9kZSwnICtcbiAgJ2ZlbW9ycGhvbG9neSxmZW9mZnNldCxmZXBvaW50bGlnaHQsZmVzcGVjdWxhcmxpZ2h0aW5nLGZlc3BvdGxpZ2h0LGZldGlsZSxmZXR1cmJ1bGVuY2UsJyArXG4gICdnLGltYWdlLGxpbmUsbGluZWFyZ3JhZGllbnQsbWFya2VyLG1hc2sscGF0aCxwYXR0ZXJuLHBvbHlnb24scG9seWxpbmUscmFkaWFsZ3JhZGllbnQsJyArXG4gICdyZWN0LHN0b3Asc3dpdGNoLHN5bWJvbCx0ZXh0LHRleHRwYXRoLHRpdGxlLHRzcGFuLHVzZSx2aWV3JztcblxuLyoqIEF0dHJpYnV0ZXMgd2hvc2UgdmFsdWUgaXMgYSBVUkwgYW5kIG11c3QgbWF0Y2ggYSBzYWZlIHBhdHRlcm4uICovXG5jb25zdCBVUkxfQVRUUklCVVRFUyA9ICdiYWNrZ3JvdW5kLGNpdGUsaHJlZixsb25nZGVzYyxzcmMseGxpbms6aHJlZix4bWw6YmFzZSc7XG5cbi8qKiBOb24tVVJMIGF0dHJpYnV0ZXMgdGhhdCBhcmUgc2FmZSB0byBrZWVwIChIVE1MICsgU1ZHIHByZXNlbnRhdGlvbiBhdHRyaWJ1dGVzKS4gKi9cbmNvbnN0IFNBRkVfQVRUUklCVVRFUyA9XG4gICdhYmJyLGFjY2Vzc2tleSxhbGlnbixhbHQsYXV0b3BsYXksYXhpcyxiZ2NvbG9yLGJvcmRlcixjZWxscGFkZGluZyxjZWxsc3BhY2luZyxjbGFzcyxjbGVhciwnICtcbiAgJ2NvbG9yLGNvbHMsY29sc3Bhbixjb21wYWN0LGNvbnRyb2xzLGNvb3JkcyxkYXRldGltZSxkaXIsZG93bmxvYWQsZmFjZSxoZWFkZXJzLGhlaWdodCwnICtcbiAgJ2hpZGRlbixocmVmbGFuZyxoc3BhY2UsaXNtYXAsaXRlbXByb3AsaXRlbXNjb3BlLGxhbmcsbGFuZ3VhZ2UsbG9vcCxtZWRpYSxtdXRlZCxub2hyZWYsJyArXG4gICdub3dyYXAsb3BlbixwcmVsb2FkLHJlbCxyZXYscm9sZSxyb3dzLHJvd3NwYW4scnVsZXMsc2NvcGUsc2Nyb2xsaW5nLHNoYXBlLHNpemUsc2l6ZXMsc3BhbiwnICtcbiAgJ3NyY2xhbmcsc3Jjc2V0LHN0YXJ0LHN0eWxlLHN1bW1hcnksdGFiaW5kZXgsdGFyZ2V0LHRpdGxlLHRyYW5zbGF0ZSx0eXBlLHVzZW1hcCx2YWxpZ24sJyArXG4gICd2YWx1ZSx2c3BhY2Usd2lkdGgsJyArXG4gIC8vIFNWRyBwcmVzZW50YXRpb24gYW5kIGdlb21ldHJ5IGF0dHJpYnV0ZXMuXG4gICdhY2NlbnQtaGVpZ2h0LGFsaWdubWVudC1iYXNlbGluZSxiYXNlbGluZS1zaGlmdCxiYXNlcHJvZmlsZSxiYm94LGNhcC1oZWlnaHQsY2xpcCwnICtcbiAgJ2NsaXAtcGF0aCxjbGlwLXJ1bGUsY2xpcHBhdGh1bml0cyxjb2xvci1pbnRlcnBvbGF0aW9uLGNvbG9yLWludGVycG9sYXRpb24tZmlsdGVycywnICtcbiAgJ2NvbG9yLXByb2ZpbGUsY29sb3ItcmVuZGVyaW5nLGN1cnNvcixjeCxjeSxkLGRpcmVjdGlvbixkaXNwbGF5LGRvbWluYW50LWJhc2VsaW5lLGR4LGR5LCcgK1xuICAnZmlsbCxmaWxsLW9wYWNpdHksZmlsbC1ydWxlLGZpbHRlcnVuaXRzLGZsb29kLWNvbG9yLGZsb29kLW9wYWNpdHksZm9udC1mYW1pbHksZm9udC1zaXplLCcgK1xuICAnZm9udC1zaXplLWFkanVzdCxmb250LXN0cmV0Y2gsZm9udC1zdHlsZSxmb250LXZhcmlhbnQsZm9udC13ZWlnaHQsZngsZnksJyArXG4gICdnbHlwaC1vcmllbnRhdGlvbi1ob3Jpem9udGFsLGdseXBoLW9yaWVudGF0aW9uLXZlcnRpY2FsLGdyYWRpZW50dHJhbnNmb3JtLGdyYWRpZW50dW5pdHMsJyArXG4gICdpbWFnZS1yZW5kZXJpbmcsaW4saW4yLGsxLGsyLGszLGs0LGtlcm5pbmcsbGV0dGVyLXNwYWNpbmcsbGlnaHRpbmctY29sb3IsbWFya2VyLWVuZCwnICtcbiAgJ21hcmtlci1taWQsbWFya2VyLXN0YXJ0LG1hcmtlcmhlaWdodCxtYXJrZXJ1bml0cyxtYXJrZXJ3aWR0aCxtYXNrLG1hc2tjb250ZW50dW5pdHMsJyArXG4gICdtYXNrdW5pdHMsbW9kZSxvZmZzZXQsb3BhY2l0eSxvcGVyYXRvcixvcmRlcixvcmllbnQsb3ZlcmZsb3cscGFpbnQtb3JkZXIscGF0aGxlbmd0aCwnICtcbiAgJ3BhdHRlcm5jb250ZW50dW5pdHMscGF0dGVybnRyYW5zZm9ybSxwYXR0ZXJudW5pdHMscG9pbnRzLHByZXNlcnZlYXNwZWN0cmF0aW8scixyYWRpdXMsJyArXG4gICdyZWZ4LHJlZnkscmVwZWF0Y291bnQscmVwZWF0ZHVyLHJlcXVpcmVkZXh0ZW5zaW9ucyxyZXF1aXJlZGZlYXR1cmVzLHJlc3RhcnQscmVzdWx0LHJvdGF0ZSwnICtcbiAgJ3J4LHJ5LHNjYWxlLHNlZWQsc2hhcGUtcmVuZGVyaW5nLHNwcmVhZG1ldGhvZCxzdGFydG9mZnNldCxzdGRkZXZpYXRpb24sc3RvcC1jb2xvciwnICtcbiAgJ3N0b3Atb3BhY2l0eSxzdHJva2Usc3Ryb2tlLWRhc2hhcnJheSxzdHJva2UtZGFzaG9mZnNldCxzdHJva2UtbGluZWNhcCxzdHJva2UtbGluZWpvaW4sJyArXG4gICdzdHJva2UtbWl0ZXJsaW1pdCxzdHJva2Utb3BhY2l0eSxzdHJva2Utd2lkdGgsc3lzdGVtbGFuZ3VhZ2UsdGV4dC1hbmNob3IsdGV4dC1kZWNvcmF0aW9uLCcgK1xuICAndGV4dC1yZW5kZXJpbmcsdHJhbnNmb3JtLHRyYW5zZm9ybS1vcmlnaW4sdTEsdTIsdW5pY29kZS1iaWRpLHZlY3Rvci1lZmZlY3QsdmVyc2lvbiwnICtcbiAgJ3ZpZXdib3gsdmlzaWJpbGl0eSx3aGl0ZS1zcGFjZSx3b3JkLXNwYWNpbmcsd3JpdGluZy1tb2RlLHgseDEseDIseG1sbnMseG1sbnM6eGxpbmssJyArXG4gICd4bWw6bGFuZyx4bWw6c3BhY2UseSx5MSx5Mix6b29tYW5kcGFuJztcblxuY29uc3QgdG9TZXQgPSAoY3N2OiBzdHJpbmcpID0+IG5ldyBTZXQoY3N2LnNwbGl0KCcsJykpO1xuXG5jb25zdCBBTExPV0VEX0VMRU1FTlRTID0gdG9TZXQoSFRNTF9FTEVNRU5UUyArICcsJyArIFNWR19FTEVNRU5UUyk7XG5jb25zdCBBTExPV0VEX0FUVFJJQlVURVMgPSB0b1NldChTQUZFX0FUVFJJQlVURVMpO1xuY29uc3QgVVJMX0FUVFJJQlVURV9TRVQgPSB0b1NldChVUkxfQVRUUklCVVRFUyk7XG5cbi8qKlxuICogU2FmZSBVUkwgcGF0dGVybiAoc2FtZSBhcyBBbmd1bGFyJ3MpOiBhbGxvd3MgaHR0cChzKSwgbWFpbHRvLCBmdHAsIHRlbCwgc21zXG4gKiBhbmQgcmVsYXRpdmUgVVJMczsgcmVqZWN0cyBgamF2YXNjcmlwdDpgLCBgdmJzY3JpcHQ6YCBhbmQgb3RoZXIgc2NoZW1lcy5cbiAqL1xuY29uc3QgU0FGRV9VUkxfUEFUVEVSTiA9IC9eKD86KD86aHR0cHM/fG1haWx0b3xmdHB8dGVsfGZpbGV8c21zKTp8W14mOi8/I10qKD86Wy8/I118JCkpL2k7XG5cbi8qKiBTYWZlIGBkYXRhOmAgVVJMIHBhdHRlcm4gKHNhbWUgYXMgQW5ndWxhcidzKTogYmFzZTY0IGltYWdlL3ZpZGVvL2F1ZGlvIG9ubHkuICovXG5jb25zdCBEQVRBX1VSTF9QQVRURVJOID1cbiAgL15kYXRhOig/OmltYWdlXFwvKD86Ym1wfGdpZnxqcGVnfGpwZ3xwbmd8dGlmZnx3ZWJwKXx2aWRlb1xcLyg/Om1wZWd8bXA0fG9nZ3x3ZWJtKXxhdWRpb1xcLyg/Om1wM3xvZ2F8b2dnfG9wdXMpKTtiYXNlNjQsW2EtejAtOSsvXSs9KiQvaTtcblxuY29uc3QgaXNTYWZlVXJsID0gKHZhbHVlOiBzdHJpbmcpOiBib29sZWFuID0+IHtcbiAgY29uc3QgdXJsID0gdmFsdWUudHJpbSgpO1xuICByZXR1cm4gU0FGRV9VUkxfUEFUVEVSTi50ZXN0KHVybCkgfHwgREFUQV9VUkxfUEFUVEVSTi50ZXN0KHVybCk7XG59O1xuXG5jb25zdCBlc2NhcGVIdG1sID0gKHRleHQ6IHN0cmluZyk6IHN0cmluZyA9PlxuICB0ZXh0LnJlcGxhY2UoLyYvZywgJyZhbXA7JykucmVwbGFjZSgvPC9nLCAnJmx0OycpLnJlcGxhY2UoLz4vZywgJyZndDsnKTtcblxuLyoqIFBhcnNlcyBIVE1MIGludG8gYW4gaW5lcnQgZG9jdW1lbnQgc28gbm90aGluZyBleGVjdXRlcyBvciBsb2FkcyB3aGlsZSBzYW5pdGl6aW5nLiAqL1xuY29uc3QgcGFyc2VJbmVydCA9IChodG1sOiBzdHJpbmcpOiBIVE1MRWxlbWVudCB8IG51bGwgPT4ge1xuICBpZiAodHlwZW9mIERPTVBhcnNlciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm4gbmV3IERPTVBhcnNlcigpLnBhcnNlRnJvbVN0cmluZyhgPGJvZHk+JHtodG1sfTwvYm9keT5gLCAndGV4dC9odG1sJykuYm9keTtcbiAgfVxuICBpZiAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJykge1xuICAgIGNvbnN0IGluZXJ0RG9jdW1lbnQgPSBkb2N1bWVudC5pbXBsZW1lbnRhdGlvbi5jcmVhdGVIVE1MRG9jdW1lbnQoJ3Nhbml0aXphdGlvbicpO1xuICAgIGluZXJ0RG9jdW1lbnQuYm9keS5pbm5lckhUTUwgPSBodG1sO1xuICAgIHJldHVybiBpbmVydERvY3VtZW50LmJvZHk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59O1xuXG5jb25zdCBzYW5pdGl6ZUF0dHJpYnV0ZXMgPSAoZWxlbWVudDogRWxlbWVudCk6IHZvaWQgPT4ge1xuICBjb25zdCBpc1VzZUVsZW1lbnQgPSBlbGVtZW50Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICd1c2UnO1xuICBmb3IgKGNvbnN0IGF0dHJpYnV0ZSBvZiBBcnJheS5mcm9tKGVsZW1lbnQuYXR0cmlidXRlcykpIHtcbiAgICBjb25zdCBuYW1lID0gYXR0cmlidXRlLm5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoVVJMX0FUVFJJQlVURV9TRVQuaGFzKG5hbWUpKSB7XG4gICAgICAvLyBgPHVzZT5gIG1heSBvbmx5IHJlZmVyZW5jZSBzYW1lLWRvY3VtZW50IGZyYWdtZW50czsgZXh0ZXJuYWwgb3IgZGF0YTpcbiAgICAgIC8vIHJlZmVyZW5jZXMgYXJlIGEga25vd24gU1ZHIGF0dGFjayB2ZWN0b3IuXG4gICAgICBjb25zdCBzYWZlID0gaXNVc2VFbGVtZW50XG4gICAgICAgID8gYXR0cmlidXRlLnZhbHVlLnRyaW0oKS5zdGFydHNXaXRoKCcjJylcbiAgICAgICAgOiBpc1NhZmVVcmwoYXR0cmlidXRlLnZhbHVlKTtcbiAgICAgIGlmICghc2FmZSkge1xuICAgICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShhdHRyaWJ1dGUubmFtZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChuYW1lLnN0YXJ0c1dpdGgoJ29uJykgfHwgIUFMTE9XRURfQVRUUklCVVRFUy5oYXMobmFtZSkpIHtcbiAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKGF0dHJpYnV0ZS5uYW1lKTtcbiAgICB9XG4gIH1cbn07XG5cbmNvbnN0IHNhbml0aXplQ2hpbGRyZW4gPSAobm9kZTogTm9kZSk6IHZvaWQgPT4ge1xuICBmb3IgKGNvbnN0IGNoaWxkIG9mIEFycmF5LmZyb20obm9kZS5jaGlsZE5vZGVzKSkge1xuICAgIGlmIChjaGlsZC5ub2RlVHlwZSA9PT0gMSAvKiBFTEVNRU5UX05PREUgKi8pIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSBjaGlsZCBhcyBFbGVtZW50O1xuICAgICAgaWYgKCFBTExPV0VEX0VMRU1FTlRTLmhhcyhlbGVtZW50Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkpKSB7XG4gICAgICAgIC8vIERyb3AgZGlzYWxsb3dlZCBlbGVtZW50cyBlbnRpcmVseSwgaW5jbHVkaW5nIHRoZWlyIHN1YnRyZWUuXG4gICAgICAgIGVsZW1lbnQucmVtb3ZlKCk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgc2FuaXRpemVBdHRyaWJ1dGVzKGVsZW1lbnQpO1xuICAgICAgc2FuaXRpemVDaGlsZHJlbihlbGVtZW50KTtcbiAgICB9IGVsc2UgaWYgKGNoaWxkLm5vZGVUeXBlICE9PSAzIC8qIFRFWFRfTk9ERSAqLykge1xuICAgICAgLy8gUmVtb3ZlIGNvbW1lbnRzLCBDREFUQSBhbmQgcHJvY2Vzc2luZyBpbnN0cnVjdGlvbnMg4oCUIGFsbCBhcmUgbVhTUyB2ZWN0b3JzLlxuICAgICAgKGNoaWxkIGFzIENoaWxkTm9kZSkucmVtb3ZlKCk7XG4gICAgfVxuICB9XG59O1xuXG4vKiogU2FuaXRpemVzIGFuIEhUTUwgc3RyaW5nIHdoaWxlIGtlZXBpbmcgaW5saW5lIGA8c3ZnPmAgY29udGVudC4gKi9cbmV4cG9ydCBjb25zdCBzYW5pdGl6ZUh0bWwgPSAoaHRtbDogc3RyaW5nKTogc3RyaW5nID0+IHtcbiAgaWYgKCFodG1sKSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG4gIGNvbnN0IGJvZHkgPSBwYXJzZUluZXJ0KGh0bWwpO1xuICBpZiAoYm9keSA9PT0gbnVsbCkge1xuICAgIC8vIE5vIERPTSBhdmFpbGFibGUgKGUuZy4gc2VydmVyLXNpZGUgcmVuZGVyaW5nKTogcmVuZGVyIGFzIHBsYWluIHRleHQuXG4gICAgcmV0dXJuIGVzY2FwZUh0bWwoaHRtbCk7XG4gIH1cbiAgc2FuaXRpemVDaGlsZHJlbihib2R5KTtcbiAgcmV0dXJuIGJvZHkuaW5uZXJIVE1MO1xufTtcblxuLyoqIEV4dHJhY3RzIHRoZSBwbGFpbiB0ZXh0IG9mIGFuIEhUTUwgc3RyaW5nIChlLmcuIGZvciBBUklBIGRlc2NyaXB0aW9ucykuICovXG5leHBvcnQgY29uc3QgaHRtbFRvUGxhaW5UZXh0ID0gKGh0bWw6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gIGlmICghaHRtbCkge1xuICAgIHJldHVybiAnJztcbiAgfVxuICBjb25zdCBib2R5ID0gcGFyc2VJbmVydChodG1sKTtcbiAgcmV0dXJuIChib2R5ID09PSBudWxsID8gaHRtbC5yZXBsYWNlKC88W14+XSo+L2csICcgJykgOiBib2R5LnRleHRDb250ZW50IHx8ICcnKVxuICAgIC5yZXBsYWNlKC9cXHMrL2csICcgJylcbiAgICAudHJpbSgpO1xufTtcbiJdfQ==