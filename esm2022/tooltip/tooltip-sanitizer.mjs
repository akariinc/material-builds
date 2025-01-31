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
export class TooltipSanitizer extends DomSanitizer {
    constructor() {
        super();
    }
    /** Main sanitization function */
    sanitize(context, value) {
        if (context === SecurityContext.HTML && typeof value === 'string') {
            return this._sanitizeTooltipHtml(value);
        }
        return value;
    }
    /** Function to sanitize HTML while keeping &lt;svg&gt; */
    _sanitizeTooltipHtml(html) {
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: TooltipSanitizer, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: TooltipSanitizer }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: TooltipSanitizer, decorators: [{
            type: Injectable
        }], ctorParameters: () => [] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbHRpcC1zYW5pdGl6ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvbWF0ZXJpYWwvdG9vbHRpcC90b29sdGlwLXNhbml0aXplci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFDSCxPQUFPLEVBQUMsWUFBWSxFQUFXLE1BQU0sMkJBQTJCLENBQUM7QUFDakUsT0FBTyxFQUFDLFVBQVUsRUFBRSxlQUFlLEVBQUMsTUFBTSxlQUFlLENBQUM7O0FBRTFEOzs7R0FHRztBQUVILE1BQU0sT0FBTyxnQkFBaUIsU0FBUSxZQUFZO0lBQ2hEO1FBQ0UsS0FBSyxFQUFFLENBQUM7SUFDVixDQUFDO0lBRUQsaUNBQWlDO0lBQ2pDLFFBQVEsQ0FBQyxPQUF3QixFQUFFLEtBQW9CO1FBQ3JELElBQUksT0FBTyxLQUFLLGVBQWUsQ0FBQyxJQUFJLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDbEUsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDMUMsQ0FBQztRQUNELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVELDBEQUEwRDtJQUNsRCxvQkFBb0IsQ0FBQyxJQUFZO1FBQ3ZDLGtKQUFrSjtRQUNsSixJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FDakIsK0VBQStFLEVBQy9FLEVBQUUsQ0FDSCxDQUFDO1FBRUYsOERBQThEO1FBQzlELElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLG1CQUFtQixFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsd0NBQXdDO1FBQ3RGLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLG1CQUFtQixFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsd0NBQXdDO1FBQ3RGLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLHNDQUFzQyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsNEJBQTRCO1FBQ3JHLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLHFDQUFxQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsNkJBQTZCO1FBRTdGLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELDBDQUEwQztJQUMxQyx1QkFBdUIsQ0FBQyxLQUFhO1FBQ25DLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVELHdCQUF3QixDQUFDLEtBQWE7UUFDcEMsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRUQseUJBQXlCLENBQUMsS0FBYTtRQUNyQyxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFRCxzQkFBc0IsQ0FBQyxLQUFhO1FBQ2xDLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVELDhCQUE4QixDQUFDLEtBQWE7UUFDMUMsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO3FIQWpEVSxnQkFBZ0I7eUhBQWhCLGdCQUFnQjs7a0dBQWhCLGdCQUFnQjtrQkFENUIsVUFBVSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtEb21TYW5pdGl6ZXIsIFNhZmVIdG1sfSBmcm9tICdAYW5ndWxhci9wbGF0Zm9ybS1icm93c2VyJztcbmltcG9ydCB7SW5qZWN0YWJsZSwgU2VjdXJpdHlDb250ZXh0fSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuLyoqXG4gKiBDdXN0b20gc2FuaXRpemVyIHRoYXQgYWxsb3dzICZsdDtzdmcmZ3Q7IGJ1dCByZW1vdmVzIGRhbmdlcm91cyBjb250ZW50XG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBUb29sdGlwU2FuaXRpemVyIGV4dGVuZHMgRG9tU2FuaXRpemVyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIC8qKiBNYWluIHNhbml0aXphdGlvbiBmdW5jdGlvbiAqL1xuICBzYW5pdGl6ZShjb250ZXh0OiBTZWN1cml0eUNvbnRleHQsIHZhbHVlOiBzdHJpbmcgfCBudWxsKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgaWYgKGNvbnRleHQgPT09IFNlY3VyaXR5Q29udGV4dC5IVE1MICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiB0aGlzLl9zYW5pdGl6ZVRvb2x0aXBIdG1sKHZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgLyoqIEZ1bmN0aW9uIHRvIHNhbml0aXplIEhUTUwgd2hpbGUga2VlcGluZyAmbHQ7c3ZnJmd0OyAqL1xuICBwcml2YXRlIF9zYW5pdGl6ZVRvb2x0aXBIdG1sKGh0bWw6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgLyoqIFJlbW92ZSAmbHQ7c2NyaXB0Jmd0OywgJmx0O2lmcmFtZSZndDssICZsdDtvYmplY3QmZ3Q7LCAmbHQ7ZW1iZWQmZ3Q7LCAmbHQ7Zm9ybSZndDssICZsdDtzdHlsZSZndDssICZsdDttZXRhJmd0OywgJmx0O2xpbmsmZ3Q7LCAmbHQ7YmFzZSZndDsgKi9cbiAgICBodG1sID0gaHRtbC5yZXBsYWNlKFxuICAgICAgLzwoc2NyaXB0fGlmcmFtZXxvYmplY3R8ZW1iZWR8Zm9ybXxtZXRhfHN0eWxlfGxpbmt8YmFzZSlbXj5dKj5bXFxzXFxTXSo/PFxcL1xcMT4vZ2ksXG4gICAgICAnJyxcbiAgICApO1xuXG4gICAgLy8gUmVtb3ZlIGRhbmdlcm91cyBhdHRyaWJ1dGVzIChvblggZXZlbnRzLCBqYXZhc2NyaXB0OiBsaW5rcylcbiAgICBodG1sID0gaHRtbC5yZXBsYWNlKC9cXHNvblxcdys9XCJbXlwiXSpcIi9naSwgJycpOyAvLyBSZW1vdmUgZXZlbnQgaGFuZGxlcnMgKGUuZy4sIG9uY2xpY2spXG4gICAgaHRtbCA9IGh0bWwucmVwbGFjZSgvXFxzb25cXHcrPSdbXiddKicvZ2ksICcnKTsgLy8gUmVtb3ZlIGV2ZW50IGhhbmRsZXJzIChzaW5nbGUgcXVvdGVzKVxuICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoL1xcc2hyZWY9WydcIl0oamF2YXNjcmlwdDopW14nXCJdKlsnXCJdL2dpLCAnaHJlZj1cIiNcIicpOyAvLyBQcmV2ZW50IGphdmFzY3JpcHQ6IGxpbmtzXG4gICAgaHRtbCA9IGh0bWwucmVwbGFjZSgvXFxzc3JjPVsnXCJdKGphdmFzY3JpcHQ6KVteJ1wiXSpbJ1wiXS9naSwgJycpOyAvLyBQcmV2ZW50IGphdmFzY3JpcHQ6IGluIHNyY1xuXG4gICAgcmV0dXJuIGh0bWw7XG4gIH1cblxuICAvKiogQnlwYXNzIHNlY3VyaXR5IHRydXN0IGZvciBzYWZlIEhUTUwgKi9cbiAgYnlwYXNzU2VjdXJpdHlUcnVzdEh0bWwodmFsdWU6IHN0cmluZyk6IFNhZmVIdG1sIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICBieXBhc3NTZWN1cml0eVRydXN0U3R5bGUodmFsdWU6IHN0cmluZyk6IFNhZmVIdG1sIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICBieXBhc3NTZWN1cml0eVRydXN0U2NyaXB0KHZhbHVlOiBzdHJpbmcpOiBTYWZlSHRtbCB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgYnlwYXNzU2VjdXJpdHlUcnVzdFVybCh2YWx1ZTogc3RyaW5nKTogU2FmZUh0bWwge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIGJ5cGFzc1NlY3VyaXR5VHJ1c3RSZXNvdXJjZVVybCh2YWx1ZTogc3RyaW5nKTogU2FmZUh0bWwge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxufVxuIl19