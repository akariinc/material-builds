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
                node.removeChild(child);
                continue;
            }
            sanitizeAttributes(element);
            sanitizeChildren(element);
        }
        else if (child.nodeType !== 3 /* TEXT_NODE */) {
            // Remove comments, CDATA and processing instructions — all are mXSS vectors.
            node.removeChild(child);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbHRpcC1jdXN0b20tc2FuaXRpemVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21hdGVyaWFsL3Rvb2x0aXAvdG9vbHRpcC1jdXN0b20tc2FuaXRpemVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVIOzs7Ozs7Ozs7Ozs7R0FZRztBQUVILGlGQUFpRjtBQUNqRixNQUFNLGFBQWEsR0FDakIsc0ZBQXNGO0lBQ3RGLHVGQUF1RjtJQUN2Rix3RkFBd0Y7SUFDeEYsc0ZBQXNGO0lBQ3RGLDZEQUE2RCxDQUFDO0FBRWhFLDBDQUEwQztBQUMxQyxNQUFNLFlBQVksR0FDaEIseUZBQXlGO0lBQ3pGLGtGQUFrRjtJQUNsRiwwRkFBMEY7SUFDMUYsd0ZBQXdGO0lBQ3hGLHVGQUF1RjtJQUN2Riw0REFBNEQsQ0FBQztBQUUvRCxxRUFBcUU7QUFDckUsTUFBTSxjQUFjLEdBQUcsdURBQXVELENBQUM7QUFFL0UscUZBQXFGO0FBQ3JGLE1BQU0sZUFBZSxHQUNuQiw0RkFBNEY7SUFDNUYsdUZBQXVGO0lBQ3ZGLHdGQUF3RjtJQUN4Riw0RkFBNEY7SUFDNUYsd0ZBQXdGO0lBQ3hGLHFCQUFxQjtJQUNyQiw0Q0FBNEM7SUFDNUMsbUZBQW1GO0lBQ25GLG9GQUFvRjtJQUNwRix5RkFBeUY7SUFDekYsMEZBQTBGO0lBQzFGLDBFQUEwRTtJQUMxRSwwRkFBMEY7SUFDMUYsc0ZBQXNGO0lBQ3RGLHFGQUFxRjtJQUNyRixzRkFBc0Y7SUFDdEYsd0ZBQXdGO0lBQ3hGLDRGQUE0RjtJQUM1RixvRkFBb0Y7SUFDcEYsd0ZBQXdGO0lBQ3hGLDJGQUEyRjtJQUMzRixxRkFBcUY7SUFDckYscUZBQXFGO0lBQ3JGLHVDQUF1QyxDQUFDO0FBRTFDLE1BQU0sS0FBSyxHQUFHLENBQUMsR0FBVyxFQUFFLEVBQUUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxD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QyxTQUFTLENBQUM7QUFDeEIsQ0FBQyxDQUFDO0FBRUYsOEVBQThFO0FBQzlFLE1BQU0sQ0FBQyxNQUFNLGVBQWUsR0FBRyxDQUFDLElBQVksRUFBVSxFQUFFO0lBQ3RELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNWLE9BQU8sRUFBRSxDQUFDO0lBQ1osQ0FBQztJQUNELE1BQU0sSUFBSSxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM5QixPQUFPLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLElBQUksRUFBRSxDQUFDO1NBQzVFLE9BQU8sQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDO1NBQ3BCLElBQUksRUFBRSxDQUFDO0FBQ1osQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKlxuICogRE9NLWJhc2VkIEhUTUwgc2FuaXRpemVyIHRoYXQgcHJlc2VydmVzIGlubGluZSBTVkcuXG4gKlxuICogQW5ndWxhcidzIGJ1aWx0LWluIHNhbml0aXplciBzdHJpcHMgU1ZHIGVsZW1lbnRzLCB3aGljaCBpcyB0aGUgcmVhc29uIHRoaXMgZm9ya1xuICogZXhpc3RzLiBUaGlzIGltcGxlbWVudGF0aW9uIGZvbGxvd3MgdGhlIHNhbWUgYXJjaGl0ZWN0dXJlIGFzIEFuZ3VsYXIncyBzYW5pdGl6ZXJcbiAqIChwYXJzZSBpbnRvIGFuIGluZXJ0IGRvY3VtZW50LCB3YWxrIHRoZSB0cmVlLCBrZWVwIG9ubHkgYWxsb3dsaXN0ZWQgZWxlbWVudHMgYW5kXG4gKiBhdHRyaWJ1dGVzLCB2YWxpZGF0ZSBVUkwtdmFsdWVkIGF0dHJpYnV0ZXMpIGluc3RlYWQgb2YgcmVnZXggcmV3cml0aW5nLCB3aGljaCBpc1xuICogYnlwYXNzYWJsZSAodW5xdW90ZWQgZXZlbnQgaGFuZGxlcnMsIHVuY2xvc2VkIHRhZ3MsIGVudGl0eS1lbmNvZGVkIFVSTHMsIGV0Yy4pLlxuICpcbiAqIEludGVudGlvbmFsbHkgTk9UIGFsbG93ZWQ6IHNjcmlwdCwgc3R5bGUsIGlmcmFtZSwgb2JqZWN0LCBlbWJlZCwgZm9ybSwgbWV0YSxcbiAqIGxpbmssIGJhc2UsIHRlbXBsYXRlLCBtYXRoLCBmb3JlaWduT2JqZWN0IChtWFNTIHZlY3RvciksIFNNSUwgYW5pbWF0aW9uXG4gKiBlbGVtZW50cyAoYXR0cmlidXRlLWluamVjdGlvbiB2ZWN0b3IsIGUuZy4gYDxhbmltYXRlIGF0dHJpYnV0ZU5hbWU9XCJocmVmXCI+YCkuXG4gKi9cblxuLyoqIEhUTUwgZWxlbWVudHMgdGhhdCBhcmUgc2FmZSB0byBrZWVwIChzYW1lIHNldCBBbmd1bGFyJ3Mgc2FuaXRpemVyIGFsbG93cykuICovXG5jb25zdCBIVE1MX0VMRU1FTlRTID1cbiAgJ2FkZHJlc3MsYXJ0aWNsZSxhc2lkZSxibG9ja3F1b3RlLGNhcHRpb24sY2VudGVyLGRlbCxkZXRhaWxzLGRpYWxvZyxkaXIsZGl2LGRsLGRkLGR0LCcgK1xuICAnZmlndXJlLGZpZ2NhcHRpb24sZm9vdGVyLGgxLGgyLGgzLGg0LGg1LGg2LGhlYWRlcixoZ3JvdXAsaHIsaW5zLG1haW4sbWFwLG1lbnUsbmF2LG9sLCcgK1xuICAnbGksdWwscHJlLHNlY3Rpb24sc3VtbWFyeSx0YWJsZSx0Ym9keSx0ZCx0Zm9vdCx0aCx0aGVhZCx0cixhLGFiYnIsYWNyb255bSxhdWRpbyxiLGJkaSwnICtcbiAgJ2JkbyxiaWcsYnIsY2l0ZSxjb2RlLGVtLGZvbnQsaSxpbWcsa2JkLGxhYmVsLG1hcmsscGljdHVyZSxxLHJwLHJ0LHJ1YnkscyxzYW1wLHNtYWxsLCcgK1xuICAnc291cmNlLHNwYW4sc3RyaWtlLHN0cm9uZyxzdWIsc3VwLHRpbWUsdHJhY2ssdHQsdSx2YXIsdmlkZW8nO1xuXG4vKiogU1ZHIGVsZW1lbnRzIHRoYXQgYXJlIHNhZmUgdG8ga2VlcC4gKi9cbmNvbnN0IFNWR19FTEVNRU5UUyA9XG4gICdzdmcsY2lyY2xlLGNsaXBwYXRoLGRlZnMsZGVzYyxlbGxpcHNlLGZpbHRlcixmZWJsZW5kLGZlY29sb3JtYXRyaXgsZmVjb21wb25lbnR0cmFuc2ZlciwnICtcbiAgJ2ZlY29tcG9zaXRlLGZlY29udm9sdmVtYXRyaXgsZmVkaWZmdXNlbGlnaHRpbmcsZmVkaXNwbGFjZW1lbnRtYXAsZmVkaXN0YW50bGlnaHQsJyArXG4gICdmZWRyb3BzaGFkb3csZmVmbG9vZCxmZWZ1bmNhLGZlZnVuY2IsZmVmdW5jZyxmZWZ1bmNyLGZlZ2F1c3NpYW5ibHVyLGZlbWVyZ2UsZmVtZXJnZW5vZGUsJyArXG4gICdmZW1vcnBob2xvZ3ksZmVvZmZzZXQsZmVwb2ludGxpZ2h0LGZlc3BlY3VsYXJsaWdodGluZyxmZXNwb3RsaWdodCxmZXRpbGUsZmV0dXJidWxlbmNlLCcgK1xuICAnZyxpbWFnZSxsaW5lLGxpbmVhcmdyYWRpZW50LG1hcmtlcixtYXNrLHBhdGgscGF0dGVybixwb2x5Z29uLHBvbHlsaW5lLHJhZGlhbGdyYWRpZW50LCcgK1xuICAncmVjdCxzdG9wLHN3aXRjaCxzeW1ib2wsdGV4dCx0ZXh0cGF0aCx0aXRsZSx0c3Bhbix1c2Usdmlldyc7XG5cbi8qKiBBdHRyaWJ1dGVzIHdob3NlIHZhbHVlIGlzIGEgVVJMIGFuZCBtdXN0IG1hdGNoIGEgc2FmZSBwYXR0ZXJuLiAqL1xuY29uc3QgVVJMX0FUVFJJQlVURVMgPSAnYmFja2dyb3VuZCxjaXRlLGhyZWYsbG9uZ2Rlc2Msc3JjLHhsaW5rOmhyZWYseG1sOmJhc2UnO1xuXG4vKiogTm9uLVVSTCBhdHRyaWJ1dGVzIHRoYXQgYXJlIHNhZmUgdG8ga2VlcCAoSFRNTCArIFNWRyBwcmVzZW50YXRpb24gYXR0cmlidXRlcykuICovXG5jb25zdCBTQUZFX0FUVFJJQlVURVMgPVxuICAnYWJicixhY2Nlc3NrZXksYWxpZ24sYWx0LGF1dG9wbGF5LGF4aXMsYmdjb2xvcixib3JkZXIsY2VsbHBhZGRpbmcsY2VsbHNwYWNpbmcsY2xhc3MsY2xlYXIsJyArXG4gICdjb2xvcixjb2xzLGNvbHNwYW4sY29tcGFjdCxjb250cm9scyxjb29yZHMsZGF0ZXRpbWUsZGlyLGRvd25sb2FkLGZhY2UsaGVhZGVycyxoZWlnaHQsJyArXG4gICdoaWRkZW4saHJlZmxhbmcsaHNwYWNlLGlzbWFwLGl0ZW1wcm9wLGl0ZW1zY29wZSxsYW5nLGxhbmd1YWdlLGxvb3AsbWVkaWEsbXV0ZWQsbm9ocmVmLCcgK1xuICAnbm93cmFwLG9wZW4scHJlbG9hZCxyZWwscmV2LHJvbGUscm93cyxyb3dzcGFuLHJ1bGVzLHNjb3BlLHNjcm9sbGluZyxzaGFwZSxzaXplLHNpemVzLHNwYW4sJyArXG4gICdzcmNsYW5nLHNyY3NldCxzdGFydCxzdHlsZSxzdW1tYXJ5LHRhYmluZGV4LHRhcmdldCx0aXRsZSx0cmFuc2xhdGUsdHlwZSx1c2VtYXAsdmFsaWduLCcgK1xuICAndmFsdWUsdnNwYWNlLHdpZHRoLCcgK1xuICAvLyBTVkcgcHJlc2VudGF0aW9uIGFuZCBnZW9tZXRyeSBhdHRyaWJ1dGVzLlxuICAnYWNjZW50LWhlaWdodCxhbGlnbm1lbnQtYmFzZWxpbmUsYmFzZWxpbmUtc2hpZnQsYmFzZXByb2ZpbGUsYmJveCxjYXAtaGVpZ2h0LGNsaXAsJyArXG4gICdjbGlwLXBhdGgsY2xpcC1ydWxlLGNsaXBwYXRodW5pdHMsY29sb3ItaW50ZXJwb2xhdGlvbixjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnMsJyArXG4gICdjb2xvci1wcm9maWxlLGNvbG9yLXJlbmRlcmluZyxjdXJzb3IsY3gsY3ksZCxkaXJlY3Rpb24sZGlzcGxheSxkb21pbmFudC1iYXNlbGluZSxkeCxkeSwnICtcbiAgJ2ZpbGwsZmlsbC1vcGFjaXR5LGZpbGwtcnVsZSxmaWx0ZXJ1bml0cyxmbG9vZC1jb2xvcixmbG9vZC1vcGFjaXR5LGZvbnQtZmFtaWx5LGZvbnQtc2l6ZSwnICtcbiAgJ2ZvbnQtc2l6ZS1hZGp1c3QsZm9udC1zdHJldGNoLGZvbnQtc3R5bGUsZm9udC12YXJpYW50LGZvbnQtd2VpZ2h0LGZ4LGZ5LCcgK1xuICAnZ2x5cGgtb3JpZW50YXRpb24taG9yaXpvbnRhbCxnbHlwaC1vcmllbnRhdGlvbi12ZXJ0aWNhbCxncmFkaWVudHRyYW5zZm9ybSxncmFkaWVudHVuaXRzLCcgK1xuICAnaW1hZ2UtcmVuZGVyaW5nLGluLGluMixrMSxrMixrMyxrNCxrZXJuaW5nLGxldHRlci1zcGFjaW5nLGxpZ2h0aW5nLWNvbG9yLG1hcmtlci1lbmQsJyArXG4gICdtYXJrZXItbWlkLG1hcmtlci1zdGFydCxtYXJrZXJoZWlnaHQsbWFya2VydW5pdHMsbWFya2Vyd2lkdGgsbWFzayxtYXNrY29udGVudHVuaXRzLCcgK1xuICAnbWFza3VuaXRzLG1vZGUsb2Zmc2V0LG9wYWNpdHksb3BlcmF0b3Isb3JkZXIsb3JpZW50LG92ZXJmbG93LHBhaW50LW9yZGVyLHBhdGhsZW5ndGgsJyArXG4gICdwYXR0ZXJuY29udGVudHVuaXRzLHBhdHRlcm50cmFuc2Zvcm0scGF0dGVybnVuaXRzLHBvaW50cyxwcmVzZXJ2ZWFzcGVjdHJhdGlvLHIscmFkaXVzLCcgK1xuICAncmVmeCxyZWZ5LHJlcGVhdGNvdW50LHJlcGVhdGR1cixyZXF1aXJlZGV4dGVuc2lvbnMscmVxdWlyZWRmZWF0dXJlcyxyZXN0YXJ0LHJlc3VsdCxyb3RhdGUsJyArXG4gICdyeCxyeSxzY2FsZSxzZWVkLHNoYXBlLXJlbmRlcmluZyxzcHJlYWRtZXRob2Qsc3RhcnRvZmZzZXQsc3RkZGV2aWF0aW9uLHN0b3AtY29sb3IsJyArXG4gICdzdG9wLW9wYWNpdHksc3Ryb2tlLHN0cm9rZS1kYXNoYXJyYXksc3Ryb2tlLWRhc2hvZmZzZXQsc3Ryb2tlLWxpbmVjYXAsc3Ryb2tlLWxpbmVqb2luLCcgK1xuICAnc3Ryb2tlLW1pdGVybGltaXQsc3Ryb2tlLW9wYWNpdHksc3Ryb2tlLXdpZHRoLHN5c3RlbWxhbmd1YWdlLHRleHQtYW5jaG9yLHRleHQtZGVjb3JhdGlvbiwnICtcbiAgJ3RleHQtcmVuZGVyaW5nLHRyYW5zZm9ybSx0cmFuc2Zvcm0tb3JpZ2luLHUxLHUyLHVuaWNvZGUtYmlkaSx2ZWN0b3ItZWZmZWN0LHZlcnNpb24sJyArXG4gICd2aWV3Ym94LHZpc2liaWxpdHksd2hpdGUtc3BhY2Usd29yZC1zcGFjaW5nLHdyaXRpbmctbW9kZSx4LHgxLHgyLHhtbG5zLHhtbG5zOnhsaW5rLCcgK1xuICAneG1sOmxhbmcseG1sOnNwYWNlLHkseTEseTIsem9vbWFuZHBhbic7XG5cbmNvbnN0IHRvU2V0ID0gKGNzdjogc3RyaW5nKSA9PiBuZXcgU2V0KGNzdi5zcGxpdCgnLCcpKTtcblxuY29uc3QgQUxMT1dFRF9FTEVNRU5UUyA9IHRvU2V0KEhUTUxfRUxFTUVOVFMgKyAnLCcgKyBTVkdfRUxFTUVOVFMpO1xuY29uc3QgQUxMT1dFRF9BVFRSSUJVVEVTID0gdG9TZXQoU0FGRV9BVFRSSUJVVEVTKTtcbmNvbnN0IFVSTF9BVFRSSUJVVEVfU0VUID0gdG9TZXQoVVJMX0FUVFJJQlVURVMpO1xuXG4vKipcbiAqIFNhZmUgVVJMIHBhdHRlcm4gKHNhbWUgYXMgQW5ndWxhcidzKTogYWxsb3dzIGh0dHAocyksIG1haWx0bywgZnRwLCB0ZWwsIHNtc1xuICogYW5kIHJlbGF0aXZlIFVSTHM7IHJlamVjdHMgYGphdmFzY3JpcHQ6YCwgYHZic2NyaXB0OmAgYW5kIG90aGVyIHNjaGVtZXMuXG4gKi9cbmNvbnN0IFNBRkVfVVJMX1BBVFRFUk4gPSAvXig/Oig/Omh0dHBzP3xtYWlsdG98ZnRwfHRlbHxmaWxlfHNtcyk6fFteJjovPyNdKig/OlsvPyNdfCQpKS9pO1xuXG4vKiogU2FmZSBgZGF0YTpgIFVSTCBwYXR0ZXJuIChzYW1lIGFzIEFuZ3VsYXIncyk6IGJhc2U2NCBpbWFnZS92aWRlby9hdWRpbyBvbmx5LiAqL1xuY29uc3QgREFUQV9VUkxfUEFUVEVSTiA9XG4gIC9eZGF0YTooPzppbWFnZVxcLyg/OmJtcHxnaWZ8anBlZ3xqcGd8cG5nfHRpZmZ8d2VicCl8dmlkZW9cXC8oPzptcGVnfG1wNHxvZ2d8d2VibSl8YXVkaW9cXC8oPzptcDN8b2dhfG9nZ3xvcHVzKSk7YmFzZTY0LFthLXowLTkrL10rPSokL2k7XG5cbmNvbnN0IGlzU2FmZVVybCA9ICh2YWx1ZTogc3RyaW5nKTogYm9vbGVhbiA9PiB7XG4gIGNvbnN0IHVybCA9IHZhbHVlLnRyaW0oKTtcbiAgcmV0dXJuIFNBRkVfVVJMX1BBVFRFUk4udGVzdCh1cmwpIHx8IERBVEFfVVJMX1BBVFRFUk4udGVzdCh1cmwpO1xufTtcblxuY29uc3QgZXNjYXBlSHRtbCA9ICh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcgPT5cbiAgdGV4dC5yZXBsYWNlKC8mL2csICcmYW1wOycpLnJlcGxhY2UoLzwvZywgJyZsdDsnKS5yZXBsYWNlKC8+L2csICcmZ3Q7Jyk7XG5cbi8qKiBQYXJzZXMgSFRNTCBpbnRvIGFuIGluZXJ0IGRvY3VtZW50IHNvIG5vdGhpbmcgZXhlY3V0ZXMgb3IgbG9hZHMgd2hpbGUgc2FuaXRpemluZy4gKi9cbmNvbnN0IHBhcnNlSW5lcnQgPSAoaHRtbDogc3RyaW5nKTogSFRNTEVsZW1lbnQgfCBudWxsID0+IHtcbiAgaWYgKHR5cGVvZiBET01QYXJzZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuIG5ldyBET01QYXJzZXIoKS5wYXJzZUZyb21TdHJpbmcoYDxib2R5PiR7aHRtbH08L2JvZHk+YCwgJ3RleHQvaHRtbCcpLmJvZHk7XG4gIH1cbiAgaWYgKHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBjb25zdCBpbmVydERvY3VtZW50ID0gZG9jdW1lbnQuaW1wbGVtZW50YXRpb24uY3JlYXRlSFRNTERvY3VtZW50KCdzYW5pdGl6YXRpb24nKTtcbiAgICBpbmVydERvY3VtZW50LmJvZHkuaW5uZXJIVE1MID0gaHRtbDtcbiAgICByZXR1cm4gaW5lcnREb2N1bWVudC5ib2R5O1xuICB9XG4gIHJldHVybiBudWxsO1xufTtcblxuY29uc3Qgc2FuaXRpemVBdHRyaWJ1dGVzID0gKGVsZW1lbnQ6IEVsZW1lbnQpOiB2b2lkID0+IHtcbiAgY29uc3QgaXNVc2VFbGVtZW50ID0gZWxlbWVudC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSAndXNlJztcbiAgZm9yIChjb25zdCBhdHRyaWJ1dGUgb2YgQXJyYXkuZnJvbShlbGVtZW50LmF0dHJpYnV0ZXMpKSB7XG4gICAgY29uc3QgbmFtZSA9IGF0dHJpYnV0ZS5uYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKFVSTF9BVFRSSUJVVEVfU0VULmhhcyhuYW1lKSkge1xuICAgICAgLy8gYDx1c2U+YCBtYXkgb25seSByZWZlcmVuY2Ugc2FtZS1kb2N1bWVudCBmcmFnbWVudHM7IGV4dGVybmFsIG9yIGRhdGE6XG4gICAgICAvLyByZWZlcmVuY2VzIGFyZSBhIGtub3duIFNWRyBhdHRhY2sgdmVjdG9yLlxuICAgICAgY29uc3Qgc2FmZSA9IGlzVXNlRWxlbWVudFxuICAgICAgICA/IGF0dHJpYnV0ZS52YWx1ZS50cmltKCkuc3RhcnRzV2l0aCgnIycpXG4gICAgICAgIDogaXNTYWZlVXJsKGF0dHJpYnV0ZS52YWx1ZSk7XG4gICAgICBpZiAoIXNhZmUpIHtcbiAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoYXR0cmlidXRlLm5hbWUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAobmFtZS5zdGFydHNXaXRoKCdvbicpIHx8ICFBTExPV0VEX0FUVFJJQlVURVMuaGFzKG5hbWUpKSB7XG4gICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShhdHRyaWJ1dGUubmFtZSk7XG4gICAgfVxuICB9XG59O1xuXG5jb25zdCBzYW5pdGl6ZUNoaWxkcmVuID0gKG5vZGU6IE5vZGUpOiB2b2lkID0+IHtcbiAgZm9yIChjb25zdCBjaGlsZCBvZiBBcnJheS5mcm9tKG5vZGUuY2hpbGROb2RlcykpIHtcbiAgICBpZiAoY2hpbGQubm9kZVR5cGUgPT09IDEgLyogRUxFTUVOVF9OT0RFICovKSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gY2hpbGQgYXMgRWxlbWVudDtcbiAgICAgIGlmICghQUxMT1dFRF9FTEVNRU5UUy5oYXMoZWxlbWVudC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpKSkge1xuICAgICAgICAvLyBEcm9wIGRpc2FsbG93ZWQgZWxlbWVudHMgZW50aXJlbHksIGluY2x1ZGluZyB0aGVpciBzdWJ0cmVlLlxuICAgICAgICBub2RlLnJlbW92ZUNoaWxkKGNoaWxkKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBzYW5pdGl6ZUF0dHJpYnV0ZXMoZWxlbWVudCk7XG4gICAgICBzYW5pdGl6ZUNoaWxkcmVuKGVsZW1lbnQpO1xuICAgIH0gZWxzZSBpZiAoY2hpbGQubm9kZVR5cGUgIT09IDMgLyogVEVYVF9OT0RFICovKSB7XG4gICAgICAvLyBSZW1vdmUgY29tbWVudHMsIENEQVRBIGFuZCBwcm9jZXNzaW5nIGluc3RydWN0aW9ucyDigJQgYWxsIGFyZSBtWFNTIHZlY3RvcnMuXG4gICAgICBub2RlLnJlbW92ZUNoaWxkKGNoaWxkKTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKiBTYW5pdGl6ZXMgYW4gSFRNTCBzdHJpbmcgd2hpbGUga2VlcGluZyBpbmxpbmUgYDxzdmc+YCBjb250ZW50LiAqL1xuZXhwb3J0IGNvbnN0IHNhbml0aXplSHRtbCA9IChodG1sOiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuICBpZiAoIWh0bWwpIHtcbiAgICByZXR1cm4gJyc7XG4gIH1cbiAgY29uc3QgYm9keSA9IHBhcnNlSW5lcnQoaHRtbCk7XG4gIGlmIChib2R5ID09PSBudWxsKSB7XG4gICAgLy8gTm8gRE9NIGF2YWlsYWJsZSAoZS5nLiBzZXJ2ZXItc2lkZSByZW5kZXJpbmcpOiByZW5kZXIgYXMgcGxhaW4gdGV4dC5cbiAgICByZXR1cm4gZXNjYXBlSHRtbChodG1sKTtcbiAgfVxuICBzYW5pdGl6ZUNoaWxkcmVuKGJvZHkpO1xuICByZXR1cm4gYm9keS5pbm5lckhUTUw7XG59O1xuXG4vKiogRXh0cmFjdHMgdGhlIHBsYWluIHRleHQgb2YgYW4gSFRNTCBzdHJpbmcgKGUuZy4gZm9yIEFSSUEgZGVzY3JpcHRpb25zKS4gKi9cbmV4cG9ydCBjb25zdCBodG1sVG9QbGFpblRleHQgPSAoaHRtbDogc3RyaW5nKTogc3RyaW5nID0+IHtcbiAgaWYgKCFodG1sKSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG4gIGNvbnN0IGJvZHkgPSBwYXJzZUluZXJ0KGh0bWwpO1xuICByZXR1cm4gKGJvZHkgPT09IG51bGwgPyBodG1sLnJlcGxhY2UoLzxbXj5dKj4vZywgJyAnKSA6IGJvZHkudGV4dENvbnRlbnQgfHwgJycpXG4gICAgLnJlcGxhY2UoL1xccysvZywgJyAnKVxuICAgIC50cmltKCk7XG59O1xuIl19