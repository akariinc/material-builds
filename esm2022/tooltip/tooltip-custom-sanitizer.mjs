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
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: TooltipCustomSanitizer, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: TooltipCustomSanitizer, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: () => [] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbHRpcC1jdXN0b20tc2FuaXRpemVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21hdGVyaWFsL3Rvb2x0aXAvdG9vbHRpcC1jdXN0b20tc2FuaXRpemVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUNILE9BQU8sRUFBQyxZQUFZLEVBQVcsTUFBTSwyQkFBMkIsQ0FBQztBQUNqRSxPQUFPLEVBQUMsVUFBVSxFQUFFLGVBQWUsRUFBQyxNQUFNLGVBQWUsQ0FBQzs7QUFFMUQ7OztHQUdHO0FBRUgsTUFBTSxPQUFPLHNCQUF1QixTQUFRLFlBQVk7SUFDdEQ7UUFDRSxLQUFLLEVBQUUsQ0FBQztJQUNWLENBQUM7SUFFRCxpQ0FBaUM7SUFDakMsUUFBUSxDQUFDLE9BQXdCLEVBQUUsS0FBb0I7UUFDckQsSUFBSSxPQUFPLEtBQUssZUFBZSxDQUFDLElBQUksSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUNsRSxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUNELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVELDBEQUEwRDtJQUNsRCxhQUFhLENBQUMsSUFBWTtRQUNoQyxrSkFBa0o7UUFDbEosSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQ2pCLCtFQUErRSxFQUMvRSxFQUFFLENBQ0gsQ0FBQztRQUVGLDhEQUE4RDtRQUM5RCxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLHdDQUF3QztRQUN0RixJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLHdDQUF3QztRQUN0RixJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxzQ0FBc0MsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLDRCQUE0QjtRQUNyRyxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxxQ0FBcUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLDZCQUE2QjtRQUU3RixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCwwQ0FBMEM7SUFDMUMsdUJBQXVCLENBQUMsS0FBYTtRQUNuQyxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFRCx3QkFBd0IsQ0FBQyxLQUFhO1FBQ3BDLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVELHlCQUF5QixDQUFDLEtBQWE7UUFDckMsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRUQsc0JBQXNCLENBQUMsS0FBYTtRQUNsQyxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFRCw4QkFBOEIsQ0FBQyxLQUFhO1FBQzFDLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztxSEFqRFUsc0JBQXNCO3lIQUF0QixzQkFBc0IsY0FEVixNQUFNOztrR0FDbEIsc0JBQXNCO2tCQURsQyxVQUFVO21CQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtEb21TYW5pdGl6ZXIsIFNhZmVIdG1sfSBmcm9tICdAYW5ndWxhci9wbGF0Zm9ybS1icm93c2VyJztcbmltcG9ydCB7SW5qZWN0YWJsZSwgU2VjdXJpdHlDb250ZXh0fSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuLyoqXG4gKiBDdXN0b20gc2FuaXRpemVyIHRoYXQgYWxsb3dzICZsdDtzdmcmZ3Q7IGJ1dCByZW1vdmVzIGRhbmdlcm91cyBjb250ZW50XG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIFRvb2x0aXBDdXN0b21TYW5pdGl6ZXIgZXh0ZW5kcyBEb21TYW5pdGl6ZXIge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgLyoqIE1haW4gc2FuaXRpemF0aW9uIGZ1bmN0aW9uICovXG4gIHNhbml0aXplKGNvbnRleHQ6IFNlY3VyaXR5Q29udGV4dCwgdmFsdWU6IHN0cmluZyB8IG51bGwpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBpZiAoY29udGV4dCA9PT0gU2VjdXJpdHlDb250ZXh0LkhUTUwgJiYgdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIHRoaXMuX3Nhbml0aXplSHRtbCh2YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIC8qKiBGdW5jdGlvbiB0byBzYW5pdGl6ZSBIVE1MIHdoaWxlIGtlZXBpbmcgJmx0O3N2ZyZndDsgKi9cbiAgcHJpdmF0ZSBfc2FuaXRpemVIdG1sKGh0bWw6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgLyoqIFJlbW92ZSAmbHQ7c2NyaXB0Jmd0OywgJmx0O2lmcmFtZSZndDssICZsdDtvYmplY3QmZ3Q7LCAmbHQ7ZW1iZWQmZ3Q7LCAmbHQ7Zm9ybSZndDssICZsdDtzdHlsZSZndDssICZsdDttZXRhJmd0OywgJmx0O2xpbmsmZ3Q7LCAmbHQ7YmFzZSZndDsgKi9cbiAgICBodG1sID0gaHRtbC5yZXBsYWNlKFxuICAgICAgLzwoc2NyaXB0fGlmcmFtZXxvYmplY3R8ZW1iZWR8Zm9ybXxtZXRhfHN0eWxlfGxpbmt8YmFzZSlbXj5dKj5bXFxzXFxTXSo/PFxcL1xcMT4vZ2ksXG4gICAgICAnJyxcbiAgICApO1xuXG4gICAgLy8gUmVtb3ZlIGRhbmdlcm91cyBhdHRyaWJ1dGVzIChvblggZXZlbnRzLCBqYXZhc2NyaXB0OiBsaW5rcylcbiAgICBodG1sID0gaHRtbC5yZXBsYWNlKC9cXHNvblxcdys9XCJbXlwiXSpcIi9naSwgJycpOyAvLyBSZW1vdmUgZXZlbnQgaGFuZGxlcnMgKGUuZy4sIG9uY2xpY2spXG4gICAgaHRtbCA9IGh0bWwucmVwbGFjZSgvXFxzb25cXHcrPSdbXiddKicvZ2ksICcnKTsgLy8gUmVtb3ZlIGV2ZW50IGhhbmRsZXJzIChzaW5nbGUgcXVvdGVzKVxuICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoL1xcc2hyZWY9WydcIl0oamF2YXNjcmlwdDopW14nXCJdKlsnXCJdL2dpLCAnaHJlZj1cIiNcIicpOyAvLyBQcmV2ZW50IGphdmFzY3JpcHQ6IGxpbmtzXG4gICAgaHRtbCA9IGh0bWwucmVwbGFjZSgvXFxzc3JjPVsnXCJdKGphdmFzY3JpcHQ6KVteJ1wiXSpbJ1wiXS9naSwgJycpOyAvLyBQcmV2ZW50IGphdmFzY3JpcHQ6IGluIHNyY1xuXG4gICAgcmV0dXJuIGh0bWw7XG4gIH1cblxuICAvKiogQnlwYXNzIHNlY3VyaXR5IHRydXN0IGZvciBzYWZlIEhUTUwgKi9cbiAgYnlwYXNzU2VjdXJpdHlUcnVzdEh0bWwodmFsdWU6IHN0cmluZyk6IFNhZmVIdG1sIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICBieXBhc3NTZWN1cml0eVRydXN0U3R5bGUodmFsdWU6IHN0cmluZyk6IFNhZmVIdG1sIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICBieXBhc3NTZWN1cml0eVRydXN0U2NyaXB0KHZhbHVlOiBzdHJpbmcpOiBTYWZlSHRtbCB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgYnlwYXNzU2VjdXJpdHlUcnVzdFVybCh2YWx1ZTogc3RyaW5nKTogU2FmZUh0bWwge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIGJ5cGFzc1NlY3VyaXR5VHJ1c3RSZXNvdXJjZVVybCh2YWx1ZTogc3RyaW5nKTogU2FmZUh0bWwge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxufVxuIl19