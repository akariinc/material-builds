/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { MAT_TOOLTIP_SCROLL_STRATEGY_FACTORY_PROVIDER, MatTooltip, TooltipComponent, } from './tooltip';
import { A11yModule } from '@angular/cdk/a11y';
import { CdkScrollableModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { MatCommonModule } from '@angular/material/core';
import { NgModule } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { TooltipSanitizer } from './tooltip-sanitizer';
import * as i0 from "@angular/core";
export class MatTooltipModule {
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: MatTooltipModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule }); }
    static { this.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "18.2.0-next.2", ngImport: i0, type: MatTooltipModule, imports: [A11yModule, CommonModule, OverlayModule, MatCommonModule, MatTooltip, TooltipComponent], exports: [MatTooltip, TooltipComponent, MatCommonModule, CdkScrollableModule] }); }
    static { this.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: MatTooltipModule, providers: [
            MAT_TOOLTIP_SCROLL_STRATEGY_FACTORY_PROVIDER,
            { provide: DomSanitizer, useClass: TooltipSanitizer },
        ], imports: [A11yModule, CommonModule, OverlayModule, MatCommonModule, MatCommonModule, CdkScrollableModule] }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: MatTooltipModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [A11yModule, CommonModule, OverlayModule, MatCommonModule, MatTooltip, TooltipComponent],
                    exports: [MatTooltip, TooltipComponent, MatCommonModule, CdkScrollableModule],
                    providers: [
                        MAT_TOOLTIP_SCROLL_STRATEGY_FACTORY_PROVIDER,
                        { provide: DomSanitizer, useClass: TooltipSanitizer },
                    ],
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21hdGVyaWFsL3Rvb2x0aXAvbW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFDTCw0Q0FBNEMsRUFDNUMsVUFBVSxFQUNWLGdCQUFnQixHQUNqQixNQUFNLFdBQVcsQ0FBQztBQUVuQixPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDN0MsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDM0QsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQzdDLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUN2RCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDdkQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN2QyxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDbkQsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0scUJBQXFCLENBQUM7O0FBVXJELE1BQU0sT0FBTyxnQkFBZ0I7cUhBQWhCLGdCQUFnQjtzSEFBaEIsZ0JBQWdCLFlBUGpCLFVBQVUsRUFBRSxZQUFZLEVBQUUsYUFBYSxFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUUsZ0JBQWdCLGFBQ3RGLFVBQVUsRUFBRSxnQkFBZ0IsRUFBRSxlQUFlLEVBQUUsbUJBQW1CO3NIQU1qRSxnQkFBZ0IsYUFMaEI7WUFDVCw0Q0FBNEM7WUFDNUMsRUFBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBQztTQUNwRCxZQUxTLFVBQVUsRUFBRSxZQUFZLEVBQUUsYUFBYSxFQUFFLGVBQWUsRUFDMUIsZUFBZSxFQUFFLG1CQUFtQjs7a0dBTWpFLGdCQUFnQjtrQkFSNUIsUUFBUTttQkFBQztvQkFDUixPQUFPLEVBQUUsQ0FBQyxVQUFVLEVBQUUsWUFBWSxFQUFFLGFBQWEsRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFFLGdCQUFnQixDQUFDO29CQUNqRyxPQUFPLEVBQUUsQ0FBQyxVQUFVLEVBQUUsZ0JBQWdCLEVBQUUsZUFBZSxFQUFFLG1CQUFtQixDQUFDO29CQUM3RSxTQUFTLEVBQUU7d0JBQ1QsNENBQTRDO3dCQUM1QyxFQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFDO3FCQUNwRDtpQkFDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBNQVRfVE9PTFRJUF9TQ1JPTExfU1RSQVRFR1lfRkFDVE9SWV9QUk9WSURFUixcbiAgTWF0VG9vbHRpcCxcbiAgVG9vbHRpcENvbXBvbmVudCxcbn0gZnJvbSAnLi90b29sdGlwJztcblxuaW1wb3J0IHtBMTF5TW9kdWxlfSBmcm9tICdAYW5ndWxhci9jZGsvYTExeSc7XG5pbXBvcnQge0Nka1Njcm9sbGFibGVNb2R1bGV9IGZyb20gJ0Bhbmd1bGFyL2Nkay9zY3JvbGxpbmcnO1xuaW1wb3J0IHtDb21tb25Nb2R1bGV9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge0RvbVNhbml0aXplcn0gZnJvbSAnQGFuZ3VsYXIvcGxhdGZvcm0tYnJvd3Nlcic7XG5pbXBvcnQge01hdENvbW1vbk1vZHVsZX0gZnJvbSAnQGFuZ3VsYXIvbWF0ZXJpYWwvY29yZSc7XG5pbXBvcnQge05nTW9kdWxlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T3ZlcmxheU1vZHVsZX0gZnJvbSAnQGFuZ3VsYXIvY2RrL292ZXJsYXknO1xuaW1wb3J0IHtUb29sdGlwU2FuaXRpemVyfSBmcm9tICcuL3Rvb2x0aXAtc2FuaXRpemVyJztcblxuQE5nTW9kdWxlKHtcbiAgaW1wb3J0czogW0ExMXlNb2R1bGUsIENvbW1vbk1vZHVsZSwgT3ZlcmxheU1vZHVsZSwgTWF0Q29tbW9uTW9kdWxlLCBNYXRUb29sdGlwLCBUb29sdGlwQ29tcG9uZW50XSxcbiAgZXhwb3J0czogW01hdFRvb2x0aXAsIFRvb2x0aXBDb21wb25lbnQsIE1hdENvbW1vbk1vZHVsZSwgQ2RrU2Nyb2xsYWJsZU1vZHVsZV0sXG4gIHByb3ZpZGVyczogW1xuICAgIE1BVF9UT09MVElQX1NDUk9MTF9TVFJBVEVHWV9GQUNUT1JZX1BST1ZJREVSLFxuICAgIHtwcm92aWRlOiBEb21TYW5pdGl6ZXIsIHVzZUNsYXNzOiBUb29sdGlwU2FuaXRpemVyfSxcbiAgXSxcbn0pXG5leHBvcnQgY2xhc3MgTWF0VG9vbHRpcE1vZHVsZSB7fVxuIl19