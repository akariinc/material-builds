/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/** Function to sanitize HTML while keeping &lt;svg&gt; */
export const sanitizeHtml = (html) => {
    /** Remove &lt;script&gt;, &lt;iframe&gt;, &lt;object&gt;, &lt;embed&gt;, &lt;form&gt;, &lt;style&gt;, &lt;meta&gt;, &lt;link&gt;, &lt;base&gt; */
    html = html.replace(/<(script|iframe|object|embed|form|meta|style|link|base)[^>]*>[\s\S]*?<\/\1>/gi, '');
    // Remove dangerous attributes (onX events, javascript: links)
    html = html.replace(/\son\w+="[^"]*"/gi, ''); // Remove event handlers (e.g., onclick)
    html = html.replace(/\son\w+='[^']*'/gi, ''); // Remove event handlers (single quotes)
    html = html.replace(/\shref=['"](javascript:)[^'"]*['"]/gi, 'href="#"'); // Prevent javascript: links
    html = html.replace(/\ssrc=['"](javascript:)[^'"]*['"]/gi, ''); // Prevent javascript: in src
    return html;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbHRpcC1jdXN0b20tc2FuaXRpemVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21hdGVyaWFsL3Rvb2x0aXAvdG9vbHRpcC1jdXN0b20tc2FuaXRpemVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILDBEQUEwRDtBQUMxRCxNQUFNLENBQUMsTUFBTSxZQUFZLEdBQUcsQ0FBQyxJQUFZLEVBQVUsRUFBRTtJQUNuRCxrSkFBa0o7SUFDbEosSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQ2pCLCtFQUErRSxFQUMvRSxFQUFFLENBQ0gsQ0FBQztJQUVGLDhEQUE4RDtJQUM5RCxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLHdDQUF3QztJQUN0RixJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLHdDQUF3QztJQUN0RixJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxzQ0FBc0MsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLDRCQUE0QjtJQUNyRyxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxxQ0FBcUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLDZCQUE2QjtJQUU3RixPQUFPLElBQUksQ0FBQztBQUNkLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKiogRnVuY3Rpb24gdG8gc2FuaXRpemUgSFRNTCB3aGlsZSBrZWVwaW5nICZsdDtzdmcmZ3Q7ICovXG5leHBvcnQgY29uc3Qgc2FuaXRpemVIdG1sID0gKGh0bWw6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gIC8qKiBSZW1vdmUgJmx0O3NjcmlwdCZndDssICZsdDtpZnJhbWUmZ3Q7LCAmbHQ7b2JqZWN0Jmd0OywgJmx0O2VtYmVkJmd0OywgJmx0O2Zvcm0mZ3Q7LCAmbHQ7c3R5bGUmZ3Q7LCAmbHQ7bWV0YSZndDssICZsdDtsaW5rJmd0OywgJmx0O2Jhc2UmZ3Q7ICovXG4gIGh0bWwgPSBodG1sLnJlcGxhY2UoXG4gICAgLzwoc2NyaXB0fGlmcmFtZXxvYmplY3R8ZW1iZWR8Zm9ybXxtZXRhfHN0eWxlfGxpbmt8YmFzZSlbXj5dKj5bXFxzXFxTXSo/PFxcL1xcMT4vZ2ksXG4gICAgJycsXG4gICk7XG5cbiAgLy8gUmVtb3ZlIGRhbmdlcm91cyBhdHRyaWJ1dGVzIChvblggZXZlbnRzLCBqYXZhc2NyaXB0OiBsaW5rcylcbiAgaHRtbCA9IGh0bWwucmVwbGFjZSgvXFxzb25cXHcrPVwiW15cIl0qXCIvZ2ksICcnKTsgLy8gUmVtb3ZlIGV2ZW50IGhhbmRsZXJzIChlLmcuLCBvbmNsaWNrKVxuICBodG1sID0gaHRtbC5yZXBsYWNlKC9cXHNvblxcdys9J1teJ10qJy9naSwgJycpOyAvLyBSZW1vdmUgZXZlbnQgaGFuZGxlcnMgKHNpbmdsZSBxdW90ZXMpXG4gIGh0bWwgPSBodG1sLnJlcGxhY2UoL1xcc2hyZWY9WydcIl0oamF2YXNjcmlwdDopW14nXCJdKlsnXCJdL2dpLCAnaHJlZj1cIiNcIicpOyAvLyBQcmV2ZW50IGphdmFzY3JpcHQ6IGxpbmtzXG4gIGh0bWwgPSBodG1sLnJlcGxhY2UoL1xcc3NyYz1bJ1wiXShqYXZhc2NyaXB0OilbXidcIl0qWydcIl0vZ2ksICcnKTsgLy8gUHJldmVudCBqYXZhc2NyaXB0OiBpbiBzcmNcblxuICByZXR1cm4gaHRtbDtcbn07XG4iXX0=