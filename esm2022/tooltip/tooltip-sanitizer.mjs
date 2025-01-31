import { DomSanitizer } from '@angular/platform-browser';
import { Injectable, SecurityContext } from '@angular/core';
import * as i0 from "@angular/core";
/** Custom sanitizer that allows <svg> but removes dangerous content */
export class TooltipSanitizer extends DomSanitizer {
    constructor() {
        super();
    }
    /** Main sanitization function */
    sanitize(context, value) {
        if (context === SecurityContext.HTML && typeof value === 'string') {
            return this.sanitizeTooltipHtml(value);
        }
        return value;
    }
    /** Function to sanitize HTML while keeping <svg> */
    sanitizeTooltipHtml(html) {
        // Remove <script>, <iframe>, <object>, <embed>, <form>, <style>, <meta>, <link>, <base>
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbHRpcC1zYW5pdGl6ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvbWF0ZXJpYWwvdG9vbHRpcC90b29sdGlwLXNhbml0aXplci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUMsWUFBWSxFQUFXLE1BQU0sMkJBQTJCLENBQUM7QUFDakUsT0FBTyxFQUFDLFVBQVUsRUFBRSxlQUFlLEVBQUMsTUFBTSxlQUFlLENBQUM7O0FBRTFELHVFQUF1RTtBQUV2RSxNQUFNLE9BQU8sZ0JBQWlCLFNBQVEsWUFBWTtJQUNoRDtRQUNFLEtBQUssRUFBRSxDQUFDO0lBQ1YsQ0FBQztJQUVELGlDQUFpQztJQUNqQyxRQUFRLENBQUMsT0FBd0IsRUFBRSxLQUFvQjtRQUNyRCxJQUFJLE9BQU8sS0FBSyxlQUFlLENBQUMsSUFBSSxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQ2xFLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFDRCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFRCxvREFBb0Q7SUFDNUMsbUJBQW1CLENBQUMsSUFBWTtRQUN0Qyx3RkFBd0Y7UUFDeEYsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQ2pCLCtFQUErRSxFQUMvRSxFQUFFLENBQ0gsQ0FBQztRQUVGLDhEQUE4RDtRQUM5RCxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLHdDQUF3QztRQUN0RixJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLHdDQUF3QztRQUN0RixJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxzQ0FBc0MsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLDRCQUE0QjtRQUNyRyxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxxQ0FBcUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLDZCQUE2QjtRQUU3RixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCwwQ0FBMEM7SUFDMUMsdUJBQXVCLENBQUMsS0FBYTtRQUNuQyxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFRCx3QkFBd0IsQ0FBQyxLQUFhO1FBQ3BDLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVELHlCQUF5QixDQUFDLEtBQWE7UUFDckMsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRUQsc0JBQXNCLENBQUMsS0FBYTtRQUNsQyxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFRCw4QkFBOEIsQ0FBQyxLQUFhO1FBQzFDLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztxSEFqRFUsZ0JBQWdCO3lIQUFoQixnQkFBZ0I7O2tHQUFoQixnQkFBZ0I7a0JBRDVCLFVBQVUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0RvbVNhbml0aXplciwgU2FmZUh0bWx9IGZyb20gJ0Bhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXInO1xuaW1wb3J0IHtJbmplY3RhYmxlLCBTZWN1cml0eUNvbnRleHR9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG4vKiogQ3VzdG9tIHNhbml0aXplciB0aGF0IGFsbG93cyA8c3ZnPiBidXQgcmVtb3ZlcyBkYW5nZXJvdXMgY29udGVudCAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIFRvb2x0aXBTYW5pdGl6ZXIgZXh0ZW5kcyBEb21TYW5pdGl6ZXIge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgLyoqIE1haW4gc2FuaXRpemF0aW9uIGZ1bmN0aW9uICovXG4gIHNhbml0aXplKGNvbnRleHQ6IFNlY3VyaXR5Q29udGV4dCwgdmFsdWU6IHN0cmluZyB8IG51bGwpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBpZiAoY29udGV4dCA9PT0gU2VjdXJpdHlDb250ZXh0LkhUTUwgJiYgdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIHRoaXMuc2FuaXRpemVUb29sdGlwSHRtbCh2YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIC8qKiBGdW5jdGlvbiB0byBzYW5pdGl6ZSBIVE1MIHdoaWxlIGtlZXBpbmcgPHN2Zz4gKi9cbiAgcHJpdmF0ZSBzYW5pdGl6ZVRvb2x0aXBIdG1sKGh0bWw6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgLy8gUmVtb3ZlIDxzY3JpcHQ+LCA8aWZyYW1lPiwgPG9iamVjdD4sIDxlbWJlZD4sIDxmb3JtPiwgPHN0eWxlPiwgPG1ldGE+LCA8bGluaz4sIDxiYXNlPlxuICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoXG4gICAgICAvPChzY3JpcHR8aWZyYW1lfG9iamVjdHxlbWJlZHxmb3JtfG1ldGF8c3R5bGV8bGlua3xiYXNlKVtePl0qPltcXHNcXFNdKj88XFwvXFwxPi9naSxcbiAgICAgICcnLFxuICAgICk7XG5cbiAgICAvLyBSZW1vdmUgZGFuZ2Vyb3VzIGF0dHJpYnV0ZXMgKG9uWCBldmVudHMsIGphdmFzY3JpcHQ6IGxpbmtzKVxuICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoL1xcc29uXFx3Kz1cIlteXCJdKlwiL2dpLCAnJyk7IC8vIFJlbW92ZSBldmVudCBoYW5kbGVycyAoZS5nLiwgb25jbGljaylcbiAgICBodG1sID0gaHRtbC5yZXBsYWNlKC9cXHNvblxcdys9J1teJ10qJy9naSwgJycpOyAvLyBSZW1vdmUgZXZlbnQgaGFuZGxlcnMgKHNpbmdsZSBxdW90ZXMpXG4gICAgaHRtbCA9IGh0bWwucmVwbGFjZSgvXFxzaHJlZj1bJ1wiXShqYXZhc2NyaXB0OilbXidcIl0qWydcIl0vZ2ksICdocmVmPVwiI1wiJyk7IC8vIFByZXZlbnQgamF2YXNjcmlwdDogbGlua3NcbiAgICBodG1sID0gaHRtbC5yZXBsYWNlKC9cXHNzcmM9WydcIl0oamF2YXNjcmlwdDopW14nXCJdKlsnXCJdL2dpLCAnJyk7IC8vIFByZXZlbnQgamF2YXNjcmlwdDogaW4gc3JjXG5cbiAgICByZXR1cm4gaHRtbDtcbiAgfVxuXG4gIC8qKiBCeXBhc3Mgc2VjdXJpdHkgdHJ1c3QgZm9yIHNhZmUgSFRNTCAqL1xuICBieXBhc3NTZWN1cml0eVRydXN0SHRtbCh2YWx1ZTogc3RyaW5nKTogU2FmZUh0bWwge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIGJ5cGFzc1NlY3VyaXR5VHJ1c3RTdHlsZSh2YWx1ZTogc3RyaW5nKTogU2FmZUh0bWwge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIGJ5cGFzc1NlY3VyaXR5VHJ1c3RTY3JpcHQodmFsdWU6IHN0cmluZyk6IFNhZmVIdG1sIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICBieXBhc3NTZWN1cml0eVRydXN0VXJsKHZhbHVlOiBzdHJpbmcpOiBTYWZlSHRtbCB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgYnlwYXNzU2VjdXJpdHlUcnVzdFJlc291cmNlVXJsKHZhbHVlOiBzdHJpbmcpOiBTYWZlSHRtbCB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG59XG4iXX0=