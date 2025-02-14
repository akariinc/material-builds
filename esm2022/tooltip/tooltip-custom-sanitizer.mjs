/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DomSanitizer } from '@angular/platform-browser';
import { Injectable, SecurityContext } from '@angular/core';
import * as i0 from "@angular/core";
/**
 * Custom sanitizer that allows &lt;svg&gt; but removes dangerous content
 * @docs-private
 */
export class TooltipCustomSanitizer extends DomSanitizer {
    constructor() {
        super();
    }
    /** Main sanitization function */
    sanitize(context, value) {
        if (context === SecurityContext.HTML && typeof value === 'string') {
            return this._sanitizeHtml(value);
        }
        return value;
    }
    /** Function to sanitize HTML while keeping &lt;svg&gt; */
    _sanitizeHtml(html) {
        /** Remove &lt;script&gt;, &lt;iframe&gt;, &lt;object&gt;, &lt;embed&gt;, &lt;form&gt;, &lt;style&gt;, &lt;meta&gt;, &lt;link&gt;, &lt;base&gt; */
        html = html.replace(/<(script|iframe|object|embed|form|meta|style|link|base)[^>]*>[\s\S]*?<\/\1>/gi, '');
        // Remove dangerous attributes (onX events, javascript: links)
        html = html.replace(/\son\w+="[^"]*"/gi, ''); // Remove event handlers (e.g., onclick)
        html = html.replace(/\son\w+='[^']*'/gi, ''); // Remove event handlers (single quotes)
        html = html.replace(/\shref=['"](javascript:)[^'"]*['"]/gi, 'href="#"'); // Prevent javascript: links
        html = html.replace(/\ssrc=['"](javascript:)[^'"]*['"]/gi, ''); // Prevent javascript: in src
        return html;
    }
    /** Bypass security trust for safe HTML */
    bypassSecurityTrustHtml(value) {
        return value;
    }
    bypassSecurityTrustStyle(value) {
        return value;
    }
    bypassSecurityTrustScript(value) {
        return value;
    }
    bypassSecurityTrustUrl(value) {
        return value;
    }
    bypassSecurityTrustResourceUrl(value) {
        return value;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: TooltipCustomSanitizer, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: TooltipCustomSanitizer }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: TooltipCustomSanitizer, decorators: [{
            type: Injectable
        }], ctorParameters: () => [] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbHRpcC1jdXN0b20tc2FuaXRpemVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21hdGVyaWFsL3Rvb2x0aXAvdG9vbHRpcC1jdXN0b20tc2FuaXRpemVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUNILE9BQU8sRUFBQyxZQUFZLEVBQVcsTUFBTSwyQkFBMkIsQ0FBQztBQUNqRSxPQUFPLEVBQUMsVUFBVSxFQUFFLGVBQWUsRUFBQyxNQUFNLGVBQWUsQ0FBQzs7QUFFMUQ7OztHQUdHO0FBRUgsTUFBTSxPQUFPLHNCQUF1QixTQUFRLFlBQVk7SUFDdEQ7UUFDRSxLQUFLLEVBQUUsQ0FBQztJQUNWLENBQUM7SUFFRCxpQ0FBaUM7SUFDakMsUUFBUSxDQUFDLE9BQXdCLEVBQUUsS0FBb0I7UUFDckQsSUFBSSxPQUFPLEtBQUssZUFBZSxDQUFDLElBQUksSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUNsRSxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUNELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVELDBEQUEwRDtJQUNsRCxhQUFhLENBQUMsSUFBWTtRQUNoQyxrSkFBa0o7UUFDbEosSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQ2pCLCtFQUErRSxFQUMvRSxFQUFFLENBQ0gsQ0FBQztRQUVGLDhEQUE4RDtRQUM5RCxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLHdDQUF3QztRQUN0RixJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLHdDQUF3QztRQUN0RixJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxzQ0FBc0MsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLDRCQUE0QjtRQUNyRyxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxxQ0FBcUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLDZCQUE2QjtRQUU3RixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCwwQ0FBMEM7SUFDMUMsdUJBQXVCLENBQUMsS0FBYTtRQUNuQyxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFRCx3QkFBd0IsQ0FBQyxLQUFhO1FBQ3BDLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVELHlCQUF5QixDQUFDLEtBQWE7UUFDckMsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRUQsc0JBQXNCLENBQUMsS0FBYTtRQUNsQyxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFRCw4QkFBOEIsQ0FBQyxLQUFhO1FBQzFDLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztxSEFqRFUsc0JBQXNCO3lIQUF0QixzQkFBc0I7O2tHQUF0QixzQkFBc0I7a0JBRGxDLFVBQVUiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7RG9tU2FuaXRpemVyLCBTYWZlSHRtbH0gZnJvbSAnQGFuZ3VsYXIvcGxhdGZvcm0tYnJvd3Nlcic7XG5pbXBvcnQge0luamVjdGFibGUsIFNlY3VyaXR5Q29udGV4dH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbi8qKlxuICogQ3VzdG9tIHNhbml0aXplciB0aGF0IGFsbG93cyAmbHQ7c3ZnJmd0OyBidXQgcmVtb3ZlcyBkYW5nZXJvdXMgY29udGVudFxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgVG9vbHRpcEN1c3RvbVNhbml0aXplciBleHRlbmRzIERvbVNhbml0aXplciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICAvKiogTWFpbiBzYW5pdGl6YXRpb24gZnVuY3Rpb24gKi9cbiAgc2FuaXRpemUoY29udGV4dDogU2VjdXJpdHlDb250ZXh0LCB2YWx1ZTogc3RyaW5nIHwgbnVsbCk6IHN0cmluZyB8IG51bGwge1xuICAgIGlmIChjb250ZXh0ID09PSBTZWN1cml0eUNvbnRleHQuSFRNTCAmJiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gdGhpcy5fc2FuaXRpemVIdG1sKHZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgLyoqIEZ1bmN0aW9uIHRvIHNhbml0aXplIEhUTUwgd2hpbGUga2VlcGluZyAmbHQ7c3ZnJmd0OyAqL1xuICBwcml2YXRlIF9zYW5pdGl6ZUh0bWwoaHRtbDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAvKiogUmVtb3ZlICZsdDtzY3JpcHQmZ3Q7LCAmbHQ7aWZyYW1lJmd0OywgJmx0O29iamVjdCZndDssICZsdDtlbWJlZCZndDssICZsdDtmb3JtJmd0OywgJmx0O3N0eWxlJmd0OywgJmx0O21ldGEmZ3Q7LCAmbHQ7bGluayZndDssICZsdDtiYXNlJmd0OyAqL1xuICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoXG4gICAgICAvPChzY3JpcHR8aWZyYW1lfG9iamVjdHxlbWJlZHxmb3JtfG1ldGF8c3R5bGV8bGlua3xiYXNlKVtePl0qPltcXHNcXFNdKj88XFwvXFwxPi9naSxcbiAgICAgICcnLFxuICAgICk7XG5cbiAgICAvLyBSZW1vdmUgZGFuZ2Vyb3VzIGF0dHJpYnV0ZXMgKG9uWCBldmVudHMsIGphdmFzY3JpcHQ6IGxpbmtzKVxuICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoL1xcc29uXFx3Kz1cIlteXCJdKlwiL2dpLCAnJyk7IC8vIFJlbW92ZSBldmVudCBoYW5kbGVycyAoZS5nLiwgb25jbGljaylcbiAgICBodG1sID0gaHRtbC5yZXBsYWNlKC9cXHNvblxcdys9J1teJ10qJy9naSwgJycpOyAvLyBSZW1vdmUgZXZlbnQgaGFuZGxlcnMgKHNpbmdsZSBxdW90ZXMpXG4gICAgaHRtbCA9IGh0bWwucmVwbGFjZSgvXFxzaHJlZj1bJ1wiXShqYXZhc2NyaXB0OilbXidcIl0qWydcIl0vZ2ksICdocmVmPVwiI1wiJyk7IC8vIFByZXZlbnQgamF2YXNjcmlwdDogbGlua3NcbiAgICBodG1sID0gaHRtbC5yZXBsYWNlKC9cXHNzcmM9WydcIl0oamF2YXNjcmlwdDopW14nXCJdKlsnXCJdL2dpLCAnJyk7IC8vIFByZXZlbnQgamF2YXNjcmlwdDogaW4gc3JjXG5cbiAgICByZXR1cm4gaHRtbDtcbiAgfVxuXG4gIC8qKiBCeXBhc3Mgc2VjdXJpdHkgdHJ1c3QgZm9yIHNhZmUgSFRNTCAqL1xuICBieXBhc3NTZWN1cml0eVRydXN0SHRtbCh2YWx1ZTogc3RyaW5nKTogU2FmZUh0bWwge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIGJ5cGFzc1NlY3VyaXR5VHJ1c3RTdHlsZSh2YWx1ZTogc3RyaW5nKTogU2FmZUh0bWwge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIGJ5cGFzc1NlY3VyaXR5VHJ1c3RTY3JpcHQodmFsdWU6IHN0cmluZyk6IFNhZmVIdG1sIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICBieXBhc3NTZWN1cml0eVRydXN0VXJsKHZhbHVlOiBzdHJpbmcpOiBTYWZlSHRtbCB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgYnlwYXNzU2VjdXJpdHlUcnVzdFJlc291cmNlVXJsKHZhbHVlOiBzdHJpbmcpOiBTYWZlSHRtbCB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG59XG4iXX0=