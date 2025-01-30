/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { takeUntil } from 'rxjs/operators';
import { coerceBooleanProperty, coerceNumberProperty, } from '@angular/cdk/coercion';
import { ESCAPE, hasModifierKey } from '@angular/cdk/keycodes';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Directive, ElementRef, Inject, InjectionToken, Input, NgZone, Optional, ViewChild, ViewContainerRef, ViewEncapsulation, inject, ANIMATION_MODULE_TYPE, afterNextRender, Injector, } from '@angular/core';
import { DOCUMENT, NgClass } from '@angular/common';
import { normalizePassiveListenerOptions, Platform } from '@angular/cdk/platform';
import { AriaDescriber, FocusMonitor } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { Overlay, ScrollDispatcher, } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subject } from 'rxjs';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/overlay";
import * as i2 from "@angular/cdk/platform";
import * as i3 from "@angular/cdk/a11y";
import * as i4 from "@angular/cdk/bidi";
/** Time in ms to throttle repositioning after scroll events. */
export const SCROLL_THROTTLE_MS = 20;
/**
 * Creates an error to be thrown if the user supplied an invalid tooltip position.
 * @docs-private
 */
export function getMatTooltipInvalidPositionError(position) {
    return Error(`Tooltip position "${position}" is invalid.`);
}
/** Injection token that determines the scroll handling while a tooltip is visible. */
export const MAT_TOOLTIP_SCROLL_STRATEGY = new InjectionToken('mat-tooltip-scroll-strategy', {
    providedIn: 'root',
    factory: () => {
        const overlay = inject(Overlay);
        return () => overlay.scrollStrategies.reposition({ scrollThrottle: SCROLL_THROTTLE_MS });
    },
});
/** @docs-private */
export function MAT_TOOLTIP_SCROLL_STRATEGY_FACTORY(overlay) {
    return () => overlay.scrollStrategies.reposition({ scrollThrottle: SCROLL_THROTTLE_MS });
}
/** @docs-private */
export const MAT_TOOLTIP_SCROLL_STRATEGY_FACTORY_PROVIDER = {
    provide: MAT_TOOLTIP_SCROLL_STRATEGY,
    deps: [Overlay],
    useFactory: MAT_TOOLTIP_SCROLL_STRATEGY_FACTORY,
};
/** @docs-private */
export function MAT_TOOLTIP_DEFAULT_OPTIONS_FACTORY() {
    return {
        showDelay: 0,
        hideDelay: 0,
        touchendHideDelay: 1500,
    };
}
/** Injection token to be used to override the default options for `matTooltip`. */
export const MAT_TOOLTIP_DEFAULT_OPTIONS = new InjectionToken('mat-tooltip-default-options', {
    providedIn: 'root',
    factory: MAT_TOOLTIP_DEFAULT_OPTIONS_FACTORY,
});
/**
 * CSS class that will be attached to the overlay panel.
 * @deprecated
 * @breaking-change 13.0.0 remove this variable
 */
export const TOOLTIP_PANEL_CLASS = 'mat-mdc-tooltip-panel';
const PANEL_CLASS = 'tooltip-panel';
/** Options used to bind passive event listeners. */
const passiveListenerOptions = normalizePassiveListenerOptions({ passive: true });
// These constants were taken from MDC's `numbers` object. We can't import them from MDC,
// because they have some top-level references to `window` which break during SSR.
const MIN_VIEWPORT_TOOLTIP_THRESHOLD = 8;
const UNBOUNDED_ANCHOR_GAP = 8;
const MIN_HEIGHT = 24;
const MAX_WIDTH = 200;
/**
 * Directive that attaches a material design tooltip to the host element. Animates the showing and
 * hiding of a tooltip provided position (defaults to below the element).
 *
 * https://material.io/design/components/tooltips.html
 */
export class MatTooltip {
    /** Allows the user to define the position of the tooltip relative to the parent element */
    get position() {
        return this._position;
    }
    set position(value) {
        if (value !== this._position) {
            this._position = value;
            if (this._overlayRef) {
                this._updatePosition(this._overlayRef);
                this._tooltipInstance?.show(0);
                this._overlayRef.updatePosition();
            }
        }
    }
    /**
     * Whether tooltip should be relative to the click or touch origin
     * instead of outside the element bounding box.
     */
    get positionAtOrigin() {
        return this._positionAtOrigin;
    }
    set positionAtOrigin(value) {
        this._positionAtOrigin = coerceBooleanProperty(value);
        this._detach();
        this._overlayRef = null;
    }
    /** Disables the display of the tooltip. */
    get disabled() {
        return this._disabled;
    }
    set disabled(value) {
        const isDisabled = coerceBooleanProperty(value);
        if (this._disabled !== isDisabled) {
            this._disabled = isDisabled;
            // If tooltip is disabled, hide immediately.
            if (isDisabled) {
                this.hide(0);
            }
            else {
                this._setupPointerEnterEventsIfNeeded();
            }
            this._syncAriaDescription(this.message);
        }
    }
    /** The default delay in ms before showing the tooltip after show is called */
    get showDelay() {
        return this._showDelay;
    }
    set showDelay(value) {
        this._showDelay = coerceNumberProperty(value);
    }
    /** The default delay in ms before hiding the tooltip after hide is called */
    get hideDelay() {
        return this._hideDelay;
    }
    set hideDelay(value) {
        this._hideDelay = coerceNumberProperty(value);
        if (this._tooltipInstance) {
            this._tooltipInstance._mouseLeaveHideDelay = this._hideDelay;
        }
    }
    /** The message to be displayed in the tooltip */
    get message() {
        console.log('Test Output');
        return this._message;
    }
    set message(value) {
        const oldMessage = this._message;
        // If the message is not a string (e.g. number), convert it to a string and trim it.
        // Must convert with `String(value)`, not `${value}`, otherwise Closure Compiler optimises
        // away the string-conversion: https://github.com/angular/components/issues/20684
        this._message = value != null ? String(value).trim() : '';
        if (!this._message && this._isTooltipVisible()) {
            this.hide(0);
        }
        else {
            this._setupPointerEnterEventsIfNeeded();
            this._updateTooltipMessage();
        }
        this._syncAriaDescription(oldMessage);
    }
    /** Classes to be passed to the tooltip. Supports the same syntax as `ngClass`. */
    get tooltipClass() {
        return this._tooltipClass;
    }
    set tooltipClass(value) {
        this._tooltipClass = value;
        if (this._tooltipInstance) {
            this._setTooltipClass(this._tooltipClass);
        }
    }
    constructor(_overlay, _elementRef, _scrollDispatcher, _viewContainerRef, _ngZone, _platform, _ariaDescriber, _focusMonitor, scrollStrategy, _dir, _defaultOptions, _document) {
        this._overlay = _overlay;
        this._elementRef = _elementRef;
        this._scrollDispatcher = _scrollDispatcher;
        this._viewContainerRef = _viewContainerRef;
        this._ngZone = _ngZone;
        this._platform = _platform;
        this._ariaDescriber = _ariaDescriber;
        this._focusMonitor = _focusMonitor;
        this._dir = _dir;
        this._defaultOptions = _defaultOptions;
        this._position = 'below';
        this._positionAtOrigin = false;
        this._disabled = false;
        this._viewInitialized = false;
        this._pointerExitEventsInitialized = false;
        this._tooltipComponent = TooltipComponent;
        this._viewportMargin = 8;
        this._cssClassPrefix = 'mat-mdc';
        /**
         * How touch gestures should be handled by the tooltip. On touch devices the tooltip directive
         * uses a long press gesture to show and hide, however it can conflict with the native browser
         * gestures. To work around the conflict, Angular Material disables native gestures on the
         * trigger, but that might not be desirable on particular elements (e.g. inputs and draggable
         * elements). The different values for this option configure the touch event handling as follows:
         * - `auto` - Enables touch gestures for all elements, but tries to avoid conflicts with native
         *   browser gestures on particular elements. In particular, it allows text selection on inputs
         *   and textareas, and preserves the native browser dragging on elements marked as `draggable`.
         * - `on` - Enables touch gestures for all elements and disables native
         *   browser gestures with no exceptions.
         * - `off` - Disables touch gestures. Note that this will prevent the tooltip from
         *   showing on touch devices.
         */
        this.touchGestures = 'auto';
        this._message = '';
        /** Manually-bound passive event listeners. */
        this._passiveListeners = [];
        /** Timer started at the last `touchstart` event. */
        this._touchstartTimeout = null;
        /** Emits when the component is destroyed. */
        this._destroyed = new Subject();
        this._injector = inject(Injector);
        this._scrollStrategy = scrollStrategy;
        this._document = _document;
        if (_defaultOptions) {
            this._showDelay = _defaultOptions.showDelay;
            this._hideDelay = _defaultOptions.hideDelay;
            if (_defaultOptions.position) {
                this.position = _defaultOptions.position;
            }
            if (_defaultOptions.positionAtOrigin) {
                this.positionAtOrigin = _defaultOptions.positionAtOrigin;
            }
            if (_defaultOptions.touchGestures) {
                this.touchGestures = _defaultOptions.touchGestures;
            }
            if (_defaultOptions.tooltipClass) {
                this.tooltipClass = _defaultOptions.tooltipClass;
            }
        }
        _dir.change.pipe(takeUntil(this._destroyed)).subscribe(() => {
            if (this._overlayRef) {
                this._updatePosition(this._overlayRef);
            }
        });
        this._viewportMargin = MIN_VIEWPORT_TOOLTIP_THRESHOLD;
    }
    ngAfterViewInit() {
        // This needs to happen after view init so the initial values for all inputs have been set.
        this._viewInitialized = true;
        this._setupPointerEnterEventsIfNeeded();
        this._focusMonitor
            .monitor(this._elementRef)
            .pipe(takeUntil(this._destroyed))
            .subscribe(origin => {
            // Note that the focus monitor runs outside the Angular zone.
            if (!origin) {
                this._ngZone.run(() => this.hide(0));
            }
            else if (origin === 'keyboard') {
                this._ngZone.run(() => this.show());
            }
        });
    }
    /**
     * Dispose the tooltip when destroyed.
     */
    ngOnDestroy() {
        const nativeElement = this._elementRef.nativeElement;
        // Optimization: Do not call clearTimeout unless there is an active timer.
        if (this._touchstartTimeout) {
            clearTimeout(this._touchstartTimeout);
        }
        if (this._overlayRef) {
            this._overlayRef.dispose();
            this._tooltipInstance = null;
        }
        // Clean up the event listeners set in the constructor
        this._passiveListeners.forEach(([event, listener]) => {
            nativeElement.removeEventListener(event, listener, passiveListenerOptions);
        });
        this._passiveListeners.length = 0;
        this._destroyed.next();
        this._destroyed.complete();
        this._ariaDescriber.removeDescription(nativeElement, this.message, 'tooltip');
        this._focusMonitor.stopMonitoring(nativeElement);
    }
    /** Shows the tooltip after the delay in ms, defaults to tooltip-delay-show or 0ms if no input */
    show(delay = this.showDelay, origin) {
        if (this.disabled || !this.message || this._isTooltipVisible()) {
            this._tooltipInstance?._cancelPendingAnimations();
            return;
        }
        const overlayRef = this._createOverlay(origin);
        this._detach();
        this._portal =
            this._portal || new ComponentPortal(this._tooltipComponent, this._viewContainerRef);
        const instance = (this._tooltipInstance = overlayRef.attach(this._portal).instance);
        instance._triggerElement = this._elementRef.nativeElement;
        instance._mouseLeaveHideDelay = this._hideDelay;
        instance
            .afterHidden()
            .pipe(takeUntil(this._destroyed))
            .subscribe(() => this._detach());
        this._setTooltipClass(this._tooltipClass);
        this._updateTooltipMessage();
        instance.show(delay);
    }
    /** Hides the tooltip after the delay in ms, defaults to tooltip-delay-hide or 0ms if no input */
    hide(delay = this.hideDelay) {
        const instance = this._tooltipInstance;
        if (instance) {
            if (instance.isVisible()) {
                instance.hide(delay);
            }
            else {
                instance._cancelPendingAnimations();
                this._detach();
            }
        }
    }
    /** Shows/hides the tooltip */
    toggle(origin) {
        this._isTooltipVisible() ? this.hide() : this.show(undefined, origin);
    }
    /** Returns true if the tooltip is currently visible to the user */
    _isTooltipVisible() {
        return !!this._tooltipInstance && this._tooltipInstance.isVisible();
    }
    /** Create the overlay config and position strategy */
    _createOverlay(origin) {
        if (this._overlayRef) {
            const existingStrategy = this._overlayRef.getConfig()
                .positionStrategy;
            if ((!this.positionAtOrigin || !origin) && existingStrategy._origin instanceof ElementRef) {
                return this._overlayRef;
            }
            this._detach();
        }
        const scrollableAncestors = this._scrollDispatcher.getAncestorScrollContainers(this._elementRef);
        // Create connected position strategy that listens for scroll events to reposition.
        const strategy = this._overlay
            .position()
            .flexibleConnectedTo(this.positionAtOrigin ? origin || this._elementRef : this._elementRef)
            .withTransformOriginOn(`.${this._cssClassPrefix}-tooltip`)
            .withFlexibleDimensions(false)
            .withViewportMargin(this._viewportMargin)
            .withScrollableContainers(scrollableAncestors);
        strategy.positionChanges.pipe(takeUntil(this._destroyed)).subscribe(change => {
            this._updateCurrentPositionClass(change.connectionPair);
            if (this._tooltipInstance) {
                if (change.scrollableViewProperties.isOverlayClipped && this._tooltipInstance.isVisible()) {
                    // After position changes occur and the overlay is clipped by
                    // a parent scrollable then close the tooltip.
                    this._ngZone.run(() => this.hide(0));
                }
            }
        });
        this._overlayRef = this._overlay.create({
            direction: this._dir,
            positionStrategy: strategy,
            panelClass: `${this._cssClassPrefix}-${PANEL_CLASS}`,
            scrollStrategy: this._scrollStrategy(),
        });
        this._updatePosition(this._overlayRef);
        this._overlayRef
            .detachments()
            .pipe(takeUntil(this._destroyed))
            .subscribe(() => this._detach());
        this._overlayRef
            .outsidePointerEvents()
            .pipe(takeUntil(this._destroyed))
            .subscribe(() => this._tooltipInstance?._handleBodyInteraction());
        this._overlayRef
            .keydownEvents()
            .pipe(takeUntil(this._destroyed))
            .subscribe(event => {
            if (this._isTooltipVisible() && event.keyCode === ESCAPE && !hasModifierKey(event)) {
                event.preventDefault();
                event.stopPropagation();
                this._ngZone.run(() => this.hide(0));
            }
        });
        if (this._defaultOptions?.disableTooltipInteractivity) {
            this._overlayRef.addPanelClass(`${this._cssClassPrefix}-tooltip-panel-non-interactive`);
        }
        return this._overlayRef;
    }
    /** Detaches the currently-attached tooltip. */
    _detach() {
        if (this._overlayRef && this._overlayRef.hasAttached()) {
            this._overlayRef.detach();
        }
        this._tooltipInstance = null;
    }
    /** Updates the position of the current tooltip. */
    _updatePosition(overlayRef) {
        const position = overlayRef.getConfig().positionStrategy;
        const origin = this._getOrigin();
        const overlay = this._getOverlayPosition();
        position.withPositions([
            this._addOffset({ ...origin.main, ...overlay.main }),
            this._addOffset({ ...origin.fallback, ...overlay.fallback }),
        ]);
    }
    /** Adds the configured offset to a position. Used as a hook for child classes. */
    _addOffset(position) {
        const offset = UNBOUNDED_ANCHOR_GAP;
        const isLtr = !this._dir || this._dir.value == 'ltr';
        if (position.originY === 'top') {
            position.offsetY = -offset;
        }
        else if (position.originY === 'bottom') {
            position.offsetY = offset;
        }
        else if (position.originX === 'start') {
            position.offsetX = isLtr ? -offset : offset;
        }
        else if (position.originX === 'end') {
            position.offsetX = isLtr ? offset : -offset;
        }
        return position;
    }
    /**
     * Returns the origin position and a fallback position based on the user's position preference.
     * The fallback position is the inverse of the origin (e.g. `'below' -> 'above'`).
     */
    _getOrigin() {
        const isLtr = !this._dir || this._dir.value == 'ltr';
        const position = this.position;
        let originPosition;
        if (position == 'above' || position == 'below') {
            originPosition = { originX: 'center', originY: position == 'above' ? 'top' : 'bottom' };
        }
        else if (position == 'before' ||
            (position == 'left' && isLtr) ||
            (position == 'right' && !isLtr)) {
            originPosition = { originX: 'start', originY: 'center' };
        }
        else if (position == 'after' ||
            (position == 'right' && isLtr) ||
            (position == 'left' && !isLtr)) {
            originPosition = { originX: 'end', originY: 'center' };
        }
        else if (typeof ngDevMode === 'undefined' || ngDevMode) {
            throw getMatTooltipInvalidPositionError(position);
        }
        const { x, y } = this._invertPosition(originPosition.originX, originPosition.originY);
        return {
            main: originPosition,
            fallback: { originX: x, originY: y },
        };
    }
    /** Returns the overlay position and a fallback position based on the user's preference */
    _getOverlayPosition() {
        const isLtr = !this._dir || this._dir.value == 'ltr';
        const position = this.position;
        let overlayPosition;
        if (position == 'above') {
            overlayPosition = { overlayX: 'center', overlayY: 'bottom' };
        }
        else if (position == 'below') {
            overlayPosition = { overlayX: 'center', overlayY: 'top' };
        }
        else if (position == 'before' ||
            (position == 'left' && isLtr) ||
            (position == 'right' && !isLtr)) {
            overlayPosition = { overlayX: 'end', overlayY: 'center' };
        }
        else if (position == 'after' ||
            (position == 'right' && isLtr) ||
            (position == 'left' && !isLtr)) {
            overlayPosition = { overlayX: 'start', overlayY: 'center' };
        }
        else if (typeof ngDevMode === 'undefined' || ngDevMode) {
            throw getMatTooltipInvalidPositionError(position);
        }
        const { x, y } = this._invertPosition(overlayPosition.overlayX, overlayPosition.overlayY);
        return {
            main: overlayPosition,
            fallback: { overlayX: x, overlayY: y },
        };
    }
    /** Updates the tooltip message and repositions the overlay according to the new message length */
    _updateTooltipMessage() {
        // Must wait for the message to be painted to the tooltip so that the overlay can properly
        // calculate the correct positioning based on the size of the text.
        if (this._tooltipInstance) {
            this._tooltipInstance.message = this.message;
            this._tooltipInstance._markForCheck();
            afterNextRender(() => {
                if (this._tooltipInstance) {
                    this._overlayRef.updatePosition();
                }
            }, {
                injector: this._injector,
            });
        }
    }
    /** Updates the tooltip class */
    _setTooltipClass(tooltipClass) {
        if (this._tooltipInstance) {
            this._tooltipInstance.tooltipClass = tooltipClass;
            this._tooltipInstance._markForCheck();
        }
    }
    /** Inverts an overlay position. */
    _invertPosition(x, y) {
        if (this.position === 'above' || this.position === 'below') {
            if (y === 'top') {
                y = 'bottom';
            }
            else if (y === 'bottom') {
                y = 'top';
            }
        }
        else {
            if (x === 'end') {
                x = 'start';
            }
            else if (x === 'start') {
                x = 'end';
            }
        }
        return { x, y };
    }
    /** Updates the class on the overlay panel based on the current position of the tooltip. */
    _updateCurrentPositionClass(connectionPair) {
        const { overlayY, originX, originY } = connectionPair;
        let newPosition;
        // If the overlay is in the middle along the Y axis,
        // it means that it's either before or after.
        if (overlayY === 'center') {
            // Note that since this information is used for styling, we want to
            // resolve `start` and `end` to their real values, otherwise consumers
            // would have to remember to do it themselves on each consumption.
            if (this._dir && this._dir.value === 'rtl') {
                newPosition = originX === 'end' ? 'left' : 'right';
            }
            else {
                newPosition = originX === 'start' ? 'left' : 'right';
            }
        }
        else {
            newPosition = overlayY === 'bottom' && originY === 'top' ? 'above' : 'below';
        }
        if (newPosition !== this._currentPosition) {
            const overlayRef = this._overlayRef;
            if (overlayRef) {
                const classPrefix = `${this._cssClassPrefix}-${PANEL_CLASS}-`;
                overlayRef.removePanelClass(classPrefix + this._currentPosition);
                overlayRef.addPanelClass(classPrefix + newPosition);
            }
            this._currentPosition = newPosition;
        }
    }
    /** Binds the pointer events to the tooltip trigger. */
    _setupPointerEnterEventsIfNeeded() {
        // Optimization: Defer hooking up events if there's no message or the tooltip is disabled.
        if (this._disabled ||
            !this.message ||
            !this._viewInitialized ||
            this._passiveListeners.length) {
            return;
        }
        // The mouse events shouldn't be bound on mobile devices, because they can prevent the
        // first tap from firing its click event or can cause the tooltip to open for clicks.
        if (this._platformSupportsMouseEvents()) {
            this._passiveListeners.push([
                'mouseenter',
                event => {
                    this._setupPointerExitEventsIfNeeded();
                    let point = undefined;
                    if (event.x !== undefined && event.y !== undefined) {
                        point = event;
                    }
                    this.show(undefined, point);
                },
            ]);
        }
        else if (this.touchGestures !== 'off') {
            this._disableNativeGesturesIfNecessary();
            this._passiveListeners.push([
                'touchstart',
                event => {
                    const touch = event.targetTouches?.[0];
                    const origin = touch ? { x: touch.clientX, y: touch.clientY } : undefined;
                    // Note that it's important that we don't `preventDefault` here,
                    // because it can prevent click events from firing on the element.
                    this._setupPointerExitEventsIfNeeded();
                    if (this._touchstartTimeout) {
                        clearTimeout(this._touchstartTimeout);
                    }
                    const DEFAULT_LONGPRESS_DELAY = 500;
                    this._touchstartTimeout = setTimeout(() => {
                        this._touchstartTimeout = null;
                        this.show(undefined, origin);
                    }, this._defaultOptions.touchLongPressShowDelay ?? DEFAULT_LONGPRESS_DELAY);
                },
            ]);
        }
        this._addListeners(this._passiveListeners);
    }
    _setupPointerExitEventsIfNeeded() {
        if (this._pointerExitEventsInitialized) {
            return;
        }
        this._pointerExitEventsInitialized = true;
        const exitListeners = [];
        if (this._platformSupportsMouseEvents()) {
            exitListeners.push([
                'mouseleave',
                event => {
                    const newTarget = event.relatedTarget;
                    if (!newTarget || !this._overlayRef?.overlayElement.contains(newTarget)) {
                        this.hide();
                    }
                },
            ], ['wheel', event => this._wheelListener(event)]);
        }
        else if (this.touchGestures !== 'off') {
            this._disableNativeGesturesIfNecessary();
            const touchendListener = () => {
                if (this._touchstartTimeout) {
                    clearTimeout(this._touchstartTimeout);
                }
                this.hide(this._defaultOptions.touchendHideDelay);
            };
            exitListeners.push(['touchend', touchendListener], ['touchcancel', touchendListener]);
        }
        this._addListeners(exitListeners);
        this._passiveListeners.push(...exitListeners);
    }
    _addListeners(listeners) {
        listeners.forEach(([event, listener]) => {
            this._elementRef.nativeElement.addEventListener(event, listener, passiveListenerOptions);
        });
    }
    _platformSupportsMouseEvents() {
        return !this._platform.IOS && !this._platform.ANDROID;
    }
    /** Listener for the `wheel` event on the element. */
    _wheelListener(event) {
        if (this._isTooltipVisible()) {
            const elementUnderPointer = this._document.elementFromPoint(event.clientX, event.clientY);
            const element = this._elementRef.nativeElement;
            // On non-touch devices we depend on the `mouseleave` event to close the tooltip, but it
            // won't fire if the user scrolls away using the wheel without moving their cursor. We
            // work around it by finding the element under the user's cursor and closing the tooltip
            // if it's not the trigger.
            if (elementUnderPointer !== element && !element.contains(elementUnderPointer)) {
                this.hide();
            }
        }
    }
    /** Disables the native browser gestures, based on how the tooltip has been configured. */
    _disableNativeGesturesIfNecessary() {
        const gestures = this.touchGestures;
        if (gestures !== 'off') {
            const element = this._elementRef.nativeElement;
            const style = element.style;
            // If gestures are set to `auto`, we don't disable text selection on inputs and
            // textareas, because it prevents the user from typing into them on iOS Safari.
            if (gestures === 'on' || (element.nodeName !== 'INPUT' && element.nodeName !== 'TEXTAREA')) {
                style.userSelect =
                    style.msUserSelect =
                        style.webkitUserSelect =
                            style.MozUserSelect =
                                'none';
            }
            // If we have `auto` gestures and the element uses native HTML dragging,
            // we don't set `-webkit-user-drag` because it prevents the native behavior.
            if (gestures === 'on' || !element.draggable) {
                style.webkitUserDrag = 'none';
            }
            style.touchAction = 'none';
            style.webkitTapHighlightColor = 'transparent';
        }
    }
    /** Updates the tooltip's ARIA description based on it current state. */
    _syncAriaDescription(oldMessage) {
        if (this._ariaDescriptionPending) {
            return;
        }
        this._ariaDescriptionPending = true;
        this._ariaDescriber.removeDescription(this._elementRef.nativeElement, oldMessage, 'tooltip');
        this._ngZone.runOutsideAngular(() => {
            // The `AriaDescriber` has some functionality that avoids adding a description if it's the
            // same as the `aria-label` of an element, however we can't know whether the tooltip trigger
            // has a data-bound `aria-label` or when it'll be set for the first time. We can avoid the
            // issue by deferring the description by a tick so Angular has time to set the `aria-label`.
            Promise.resolve().then(() => {
                this._ariaDescriptionPending = false;
                if (this.message && !this.disabled) {
                    this._ariaDescriber.describe(this._elementRef.nativeElement, this.message, 'tooltip');
                }
            });
        });
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: MatTooltip, deps: [{ token: i1.Overlay }, { token: i0.ElementRef }, { token: i1.ScrollDispatcher }, { token: i0.ViewContainerRef }, { token: i0.NgZone }, { token: i2.Platform }, { token: i3.AriaDescriber }, { token: i3.FocusMonitor }, { token: MAT_TOOLTIP_SCROLL_STRATEGY }, { token: i4.Directionality }, { token: MAT_TOOLTIP_DEFAULT_OPTIONS, optional: true }, { token: DOCUMENT }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "18.2.0-next.2", type: MatTooltip, isStandalone: true, selector: "[matTooltip]", inputs: { position: ["matTooltipPosition", "position"], positionAtOrigin: ["matTooltipPositionAtOrigin", "positionAtOrigin"], disabled: ["matTooltipDisabled", "disabled"], showDelay: ["matTooltipShowDelay", "showDelay"], hideDelay: ["matTooltipHideDelay", "hideDelay"], touchGestures: ["matTooltipTouchGestures", "touchGestures"], message: ["matTooltip", "message"], tooltipClass: ["matTooltipClass", "tooltipClass"] }, host: { properties: { "class.mat-mdc-tooltip-disabled": "disabled" }, classAttribute: "mat-mdc-tooltip-trigger" }, exportAs: ["matTooltip"], ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: MatTooltip, decorators: [{
            type: Directive,
            args: [{
                    selector: '[matTooltip]',
                    exportAs: 'matTooltip',
                    host: {
                        'class': 'mat-mdc-tooltip-trigger',
                        '[class.mat-mdc-tooltip-disabled]': 'disabled',
                    },
                    standalone: true,
                }]
        }], ctorParameters: () => [{ type: i1.Overlay }, { type: i0.ElementRef }, { type: i1.ScrollDispatcher }, { type: i0.ViewContainerRef }, { type: i0.NgZone }, { type: i2.Platform }, { type: i3.AriaDescriber }, { type: i3.FocusMonitor }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [MAT_TOOLTIP_SCROLL_STRATEGY]
                }] }, { type: i4.Directionality }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [MAT_TOOLTIP_DEFAULT_OPTIONS]
                }] }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }], propDecorators: { position: [{
                type: Input,
                args: ['matTooltipPosition']
            }], positionAtOrigin: [{
                type: Input,
                args: ['matTooltipPositionAtOrigin']
            }], disabled: [{
                type: Input,
                args: ['matTooltipDisabled']
            }], showDelay: [{
                type: Input,
                args: ['matTooltipShowDelay']
            }], hideDelay: [{
                type: Input,
                args: ['matTooltipHideDelay']
            }], touchGestures: [{
                type: Input,
                args: ['matTooltipTouchGestures']
            }], message: [{
                type: Input,
                args: ['matTooltip']
            }], tooltipClass: [{
                type: Input,
                args: ['matTooltipClass']
            }] } });
/**
 * Internal component that wraps the tooltip's content.
 * @docs-private
 */
export class TooltipComponent {
    constructor(_changeDetectorRef, _elementRef, animationMode) {
        this._changeDetectorRef = _changeDetectorRef;
        this._elementRef = _elementRef;
        /* Whether the tooltip text overflows to multiple lines */
        this._isMultiline = false;
        /** Whether interactions on the page should close the tooltip */
        this._closeOnInteraction = false;
        /** Whether the tooltip is currently visible. */
        this._isVisible = false;
        /** Subject for notifying that the tooltip has been hidden from the view */
        this._onHide = new Subject();
        /** Name of the show animation and the class that toggles it. */
        this._showAnimation = 'mat-mdc-tooltip-show';
        /** Name of the hide animation and the class that toggles it. */
        this._hideAnimation = 'mat-mdc-tooltip-hide';
        this._animationsDisabled = animationMode === 'NoopAnimations';
    }
    /**
     * Shows the tooltip with an animation originating from the provided origin
     * @param delay Amount of milliseconds to the delay showing the tooltip.
     */
    show(delay) {
        // Cancel the delayed hide if it is scheduled
        if (this._hideTimeoutId != null) {
            clearTimeout(this._hideTimeoutId);
        }
        this._showTimeoutId = setTimeout(() => {
            this._toggleVisibility(true);
            this._showTimeoutId = undefined;
        }, delay);
    }
    /**
     * Begins the animation to hide the tooltip after the provided delay in ms.
     * @param delay Amount of milliseconds to delay showing the tooltip.
     */
    hide(delay) {
        // Cancel the delayed show if it is scheduled
        if (this._showTimeoutId != null) {
            clearTimeout(this._showTimeoutId);
        }
        this._hideTimeoutId = setTimeout(() => {
            this._toggleVisibility(false);
            this._hideTimeoutId = undefined;
        }, delay);
    }
    /** Returns an observable that notifies when the tooltip has been hidden from view. */
    afterHidden() {
        return this._onHide;
    }
    /** Whether the tooltip is being displayed. */
    isVisible() {
        return this._isVisible;
    }
    ngOnDestroy() {
        this._cancelPendingAnimations();
        this._onHide.complete();
        this._triggerElement = null;
    }
    /**
     * Interactions on the HTML body should close the tooltip immediately as defined in the
     * material design spec.
     * https://material.io/design/components/tooltips.html#behavior
     */
    _handleBodyInteraction() {
        if (this._closeOnInteraction) {
            this.hide(0);
        }
    }
    /**
     * Marks that the tooltip needs to be checked in the next change detection run.
     * Mainly used for rendering the initial text before positioning a tooltip, which
     * can be problematic in components with OnPush change detection.
     */
    _markForCheck() {
        this._changeDetectorRef.markForCheck();
    }
    _handleMouseLeave({ relatedTarget }) {
        if (!relatedTarget || !this._triggerElement.contains(relatedTarget)) {
            if (this.isVisible()) {
                this.hide(this._mouseLeaveHideDelay);
            }
            else {
                this._finalizeAnimation(false);
            }
        }
    }
    /**
     * Callback for when the timeout in this.show() gets completed.
     * This method is only needed by the mdc-tooltip, and so it is only implemented
     * in the mdc-tooltip, not here.
     */
    _onShow() {
        this._isMultiline = this._isTooltipMultiline();
        this._markForCheck();
    }
    /** Whether the tooltip text has overflown to the next line */
    _isTooltipMultiline() {
        const rect = this._elementRef.nativeElement.getBoundingClientRect();
        return rect.height > MIN_HEIGHT && rect.width >= MAX_WIDTH;
    }
    /** Event listener dispatched when an animation on the tooltip finishes. */
    _handleAnimationEnd({ animationName }) {
        if (animationName === this._showAnimation || animationName === this._hideAnimation) {
            this._finalizeAnimation(animationName === this._showAnimation);
        }
    }
    /** Cancels any pending animation sequences. */
    _cancelPendingAnimations() {
        if (this._showTimeoutId != null) {
            clearTimeout(this._showTimeoutId);
        }
        if (this._hideTimeoutId != null) {
            clearTimeout(this._hideTimeoutId);
        }
        this._showTimeoutId = this._hideTimeoutId = undefined;
    }
    /** Handles the cleanup after an animation has finished. */
    _finalizeAnimation(toVisible) {
        if (toVisible) {
            this._closeOnInteraction = true;
        }
        else if (!this.isVisible()) {
            this._onHide.next();
        }
    }
    /** Toggles the visibility of the tooltip element. */
    _toggleVisibility(isVisible) {
        // We set the classes directly here ourselves so that toggling the tooltip state
        // isn't bound by change detection. This allows us to hide it even if the
        // view ref has been detached from the CD tree.
        const tooltip = this._tooltip.nativeElement;
        const showClass = this._showAnimation;
        const hideClass = this._hideAnimation;
        tooltip.classList.remove(isVisible ? hideClass : showClass);
        tooltip.classList.add(isVisible ? showClass : hideClass);
        if (this._isVisible !== isVisible) {
            this._isVisible = isVisible;
            this._changeDetectorRef.markForCheck();
        }
        // It's common for internal apps to disable animations using `* { animation: none !important }`
        // which can break the opening sequence. Try to detect such cases and work around them.
        if (isVisible && !this._animationsDisabled && typeof getComputedStyle === 'function') {
            const styles = getComputedStyle(tooltip);
            // Use `getPropertyValue` to avoid issues with property renaming.
            if (styles.getPropertyValue('animation-duration') === '0s' ||
                styles.getPropertyValue('animation-name') === 'none') {
                this._animationsDisabled = true;
            }
        }
        if (isVisible) {
            this._onShow();
        }
        if (this._animationsDisabled) {
            tooltip.classList.add('_mat-animation-noopable');
            this._finalizeAnimation(isVisible);
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: TooltipComponent, deps: [{ token: i0.ChangeDetectorRef }, { token: i0.ElementRef }, { token: ANIMATION_MODULE_TYPE, optional: true }], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "18.2.0-next.2", type: TooltipComponent, isStandalone: true, selector: "mat-tooltip-component", host: { attributes: { "aria-hidden": "true" }, listeners: { "mouseleave": "_handleMouseLeave($event)" } }, viewQueries: [{ propertyName: "_tooltip", first: true, predicate: ["tooltip"], descendants: true, static: true }], ngImport: i0, template: "<div\n  #tooltip\n  class=\"mdc-tooltip mat-mdc-tooltip\"\n  [ngClass]=\"tooltipClass\"\n  (animationend)=\"_handleAnimationEnd($event)\"\n  [class.mdc-tooltip--multiline]=\"_isMultiline\">\n  <div class=\"mat-mdc-tooltip-surface mdc-tooltip__surface\">{{message}}</div>\n</div>\n", styles: [".mat-mdc-tooltip{position:relative;transform:scale(0);display:inline-flex}.mat-mdc-tooltip::before{content:\"\";top:0;right:0;bottom:0;left:0;z-index:-1;position:absolute}.mat-mdc-tooltip-panel-below .mat-mdc-tooltip::before{top:-8px}.mat-mdc-tooltip-panel-above .mat-mdc-tooltip::before{bottom:-8px}.mat-mdc-tooltip-panel-right .mat-mdc-tooltip::before{left:-8px}.mat-mdc-tooltip-panel-left .mat-mdc-tooltip::before{right:-8px}.mat-mdc-tooltip._mat-animation-noopable{animation:none;transform:scale(1)}.mat-mdc-tooltip-surface{word-break:normal;overflow-wrap:anywhere;padding:4px 8px;min-width:40px;max-width:200px;min-height:24px;max-height:40vh;box-sizing:border-box;overflow:hidden;text-align:center;will-change:transform,opacity;background-color:var(--mdc-plain-tooltip-container-color, var(--mat-app-inverse-surface));color:var(--mdc-plain-tooltip-supporting-text-color, var(--mat-app-inverse-on-surface));border-radius:var(--mdc-plain-tooltip-container-shape, var(--mat-app-corner-extra-small));font-family:var(--mdc-plain-tooltip-supporting-text-font, var(--mat-app-body-small-font));font-size:var(--mdc-plain-tooltip-supporting-text-size, var(--mat-app-body-small-size));font-weight:var(--mdc-plain-tooltip-supporting-text-weight, var(--mat-app-body-small-weight));line-height:var(--mdc-plain-tooltip-supporting-text-line-height, var(--mat-app-body-small-line-height));letter-spacing:var(--mdc-plain-tooltip-supporting-text-tracking, var(--mat-app-body-small-tracking))}.mat-mdc-tooltip-surface::before{position:absolute;box-sizing:border-box;width:100%;height:100%;top:0;left:0;border:1px solid rgba(0,0,0,0);border-radius:inherit;content:\"\";pointer-events:none}.mdc-tooltip--multiline .mat-mdc-tooltip-surface{text-align:left}[dir=rtl] .mdc-tooltip--multiline .mat-mdc-tooltip-surface{text-align:right}.mat-mdc-tooltip-panel.mat-mdc-tooltip-panel-non-interactive{pointer-events:none}@keyframes mat-mdc-tooltip-show{0%{opacity:0;transform:scale(0.8)}100%{opacity:1;transform:scale(1)}}@keyframes mat-mdc-tooltip-hide{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(0.8)}}.mat-mdc-tooltip-show{animation:mat-mdc-tooltip-show 150ms cubic-bezier(0, 0, 0.2, 1) forwards}.mat-mdc-tooltip-hide{animation:mat-mdc-tooltip-hide 75ms cubic-bezier(0.4, 0, 1, 1) forwards}"], dependencies: [{ kind: "directive", type: NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: TooltipComponent, decorators: [{
            type: Component,
            args: [{ selector: 'mat-tooltip-component', encapsulation: ViewEncapsulation.None, changeDetection: ChangeDetectionStrategy.OnPush, host: {
                        '(mouseleave)': '_handleMouseLeave($event)',
                        'aria-hidden': 'true',
                    }, standalone: true, imports: [NgClass], template: "<div\n  #tooltip\n  class=\"mdc-tooltip mat-mdc-tooltip\"\n  [ngClass]=\"tooltipClass\"\n  (animationend)=\"_handleAnimationEnd($event)\"\n  [class.mdc-tooltip--multiline]=\"_isMultiline\">\n  <div class=\"mat-mdc-tooltip-surface mdc-tooltip__surface\">{{message}}</div>\n</div>\n", styles: [".mat-mdc-tooltip{position:relative;transform:scale(0);display:inline-flex}.mat-mdc-tooltip::before{content:\"\";top:0;right:0;bottom:0;left:0;z-index:-1;position:absolute}.mat-mdc-tooltip-panel-below .mat-mdc-tooltip::before{top:-8px}.mat-mdc-tooltip-panel-above .mat-mdc-tooltip::before{bottom:-8px}.mat-mdc-tooltip-panel-right .mat-mdc-tooltip::before{left:-8px}.mat-mdc-tooltip-panel-left .mat-mdc-tooltip::before{right:-8px}.mat-mdc-tooltip._mat-animation-noopable{animation:none;transform:scale(1)}.mat-mdc-tooltip-surface{word-break:normal;overflow-wrap:anywhere;padding:4px 8px;min-width:40px;max-width:200px;min-height:24px;max-height:40vh;box-sizing:border-box;overflow:hidden;text-align:center;will-change:transform,opacity;background-color:var(--mdc-plain-tooltip-container-color, var(--mat-app-inverse-surface));color:var(--mdc-plain-tooltip-supporting-text-color, var(--mat-app-inverse-on-surface));border-radius:var(--mdc-plain-tooltip-container-shape, var(--mat-app-corner-extra-small));font-family:var(--mdc-plain-tooltip-supporting-text-font, var(--mat-app-body-small-font));font-size:var(--mdc-plain-tooltip-supporting-text-size, var(--mat-app-body-small-size));font-weight:var(--mdc-plain-tooltip-supporting-text-weight, var(--mat-app-body-small-weight));line-height:var(--mdc-plain-tooltip-supporting-text-line-height, var(--mat-app-body-small-line-height));letter-spacing:var(--mdc-plain-tooltip-supporting-text-tracking, var(--mat-app-body-small-tracking))}.mat-mdc-tooltip-surface::before{position:absolute;box-sizing:border-box;width:100%;height:100%;top:0;left:0;border:1px solid rgba(0,0,0,0);border-radius:inherit;content:\"\";pointer-events:none}.mdc-tooltip--multiline .mat-mdc-tooltip-surface{text-align:left}[dir=rtl] .mdc-tooltip--multiline .mat-mdc-tooltip-surface{text-align:right}.mat-mdc-tooltip-panel.mat-mdc-tooltip-panel-non-interactive{pointer-events:none}@keyframes mat-mdc-tooltip-show{0%{opacity:0;transform:scale(0.8)}100%{opacity:1;transform:scale(1)}}@keyframes mat-mdc-tooltip-hide{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(0.8)}}.mat-mdc-tooltip-show{animation:mat-mdc-tooltip-show 150ms cubic-bezier(0, 0, 0.2, 1) forwards}.mat-mdc-tooltip-hide{animation:mat-mdc-tooltip-hide 75ms cubic-bezier(0.4, 0, 1, 1) forwards}"] }]
        }], ctorParameters: () => [{ type: i0.ChangeDetectorRef }, { type: i0.ElementRef }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [ANIMATION_MODULE_TYPE]
                }] }], propDecorators: { _tooltip: [{
                type: ViewChild,
                args: ['tooltip', {
                        // Use a static query here since we interact directly with
                        // the DOM which can happen before `ngAfterViewInit`.
                        static: true,
                    }]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbHRpcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tYXRlcmlhbC90b29sdGlwL3Rvb2x0aXAudHMiLCIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvbWF0ZXJpYWwvdG9vbHRpcC90b29sdGlwLmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBQ0gsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3pDLE9BQU8sRUFFTCxxQkFBcUIsRUFDckIsb0JBQW9CLEdBRXJCLE1BQU0sdUJBQXVCLENBQUM7QUFDL0IsT0FBTyxFQUFDLE1BQU0sRUFBRSxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUM3RCxPQUFPLEVBRUwsdUJBQXVCLEVBQ3ZCLGlCQUFpQixFQUNqQixTQUFTLEVBQ1QsU0FBUyxFQUNULFVBQVUsRUFDVixNQUFNLEVBQ04sY0FBYyxFQUNkLEtBQUssRUFDTCxNQUFNLEVBRU4sUUFBUSxFQUNSLFNBQVMsRUFDVCxnQkFBZ0IsRUFDaEIsaUJBQWlCLEVBQ2pCLE1BQU0sRUFDTixxQkFBcUIsRUFDckIsZUFBZSxFQUNmLFFBQVEsR0FDVCxNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsUUFBUSxFQUFFLE9BQU8sRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ2xELE9BQU8sRUFBQywrQkFBK0IsRUFBRSxRQUFRLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNoRixPQUFPLEVBQUMsYUFBYSxFQUFFLFlBQVksRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzlELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBTUwsT0FBTyxFQUdQLGdCQUFnQixHQUdqQixNQUFNLHNCQUFzQixDQUFDO0FBQzlCLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNwRCxPQUFPLEVBQWEsT0FBTyxF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LENBQUMsSUFBSSxtQkFDcEIsdUJBQXVCLENBQUMsTUFBTSxRQUN6Qzt3QkFDSixjQUFjLEVBQUUsMkJBQTJCO3dCQUMzQyxhQUFhLEVBQUUsTUFBTTtxQkFDdEIsY0FDVyxJQUFJLFdBQ1AsQ0FBQyxPQUFPLENBQUM7OzBCQXFEZixRQUFROzswQkFBSSxNQUFNOzJCQUFDLHFCQUFxQjt5Q0FwQjNDLFFBQVE7c0JBTFAsU0FBUzt1QkFBQyxTQUFTLEVBQUU7d0JBQ3BCLDBEQUEwRDt3QkFDMUQscURBQXFEO3dCQUNyRCxNQUFNLEVBQUUsSUFBSTtxQkFDYiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHt0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7XG4gIEJvb2xlYW5JbnB1dCxcbiAgY29lcmNlQm9vbGVhblByb3BlcnR5LFxuICBjb2VyY2VOdW1iZXJQcm9wZXJ0eSxcbiAgTnVtYmVySW5wdXQsXG59IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge0VTQ0FQRSwgaGFzTW9kaWZpZXJLZXl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9rZXljb2Rlcyc7XG5pbXBvcnQge1xuICBBZnRlclZpZXdJbml0LFxuICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gIENvbXBvbmVudCxcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBJbmplY3QsXG4gIEluamVjdGlvblRva2VuLFxuICBJbnB1dCxcbiAgTmdab25lLFxuICBPbkRlc3Ryb3ksXG4gIE9wdGlvbmFsLFxuICBWaWV3Q2hpbGQsXG4gIFZpZXdDb250YWluZXJSZWYsXG4gIFZpZXdFbmNhcHN1bGF0aW9uLFxuICBpbmplY3QsXG4gIEFOSU1BVElPTl9NT0RVTEVfVFlQRSxcbiAgYWZ0ZXJOZXh0UmVuZGVyLFxuICBJbmplY3Rvcixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0RPQ1VNRU5ULCBOZ0NsYXNzfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtub3JtYWxpemVQYXNzaXZlTGlzdGVuZXJPcHRpb25zLCBQbGF0Zm9ybX0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcbmltcG9ydCB7QXJpYURlc2NyaWJlciwgRm9jdXNNb25pdG9yfSBmcm9tICdAYW5ndWxhci9jZGsvYTExeSc7XG5pbXBvcnQge0RpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge1xuICBDb25uZWN0ZWRQb3NpdGlvbixcbiAgQ29ubmVjdGlvblBvc2l0aW9uUGFpcixcbiAgRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5LFxuICBIb3Jpem9udGFsQ29ubmVjdGlvblBvcyxcbiAgT3JpZ2luQ29ubmVjdGlvblBvc2l0aW9uLFxuICBPdmVybGF5LFxuICBPdmVybGF5Q29ubmVjdGlvblBvc2l0aW9uLFxuICBPdmVybGF5UmVmLFxuICBTY3JvbGxEaXNwYXRjaGVyLFxuICBTY3JvbGxTdHJhdGVneSxcbiAgVmVydGljYWxDb25uZWN0aW9uUG9zLFxufSBmcm9tICdAYW5ndWxhci9jZGsvb3ZlcmxheSc7XG5pbXBvcnQge0NvbXBvbmVudFBvcnRhbH0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BvcnRhbCc7XG5pbXBvcnQge09ic2VydmFibGUsIFN1YmplY3R9IGZyb20gJ3J4anMnO1xuXG4vKiogUG9zc2libGUgcG9zaXRpb25zIGZvciBhIHRvb2x0aXAuICovXG5leHBvcnQgdHlwZSBUb29sdGlwUG9zaXRpb24gPSAnbGVmdCcgfCAncmlnaHQnIHwgJ2Fib3ZlJyB8ICdiZWxvdycgfCAnYmVmb3JlJyB8ICdhZnRlcic7XG5cbi8qKlxuICogT3B0aW9ucyBmb3IgaG93IHRoZSB0b29sdGlwIHRyaWdnZXIgc2hvdWxkIGhhbmRsZSB0b3VjaCBnZXN0dXJlcy5cbiAqIFNlZSBgTWF0VG9vbHRpcC50b3VjaEdlc3R1cmVzYCBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAqL1xuZXhwb3J0IHR5cGUgVG9vbHRpcFRvdWNoR2VzdHVyZXMgPSAnYXV0bycgfCAnb24nIHwgJ29mZic7XG5cbi8qKiBQb3NzaWJsZSB2aXNpYmlsaXR5IHN0YXRlcyBvZiBhIHRvb2x0aXAuICovXG5leHBvcnQgdHlwZSBUb29sdGlwVmlzaWJpbGl0eSA9ICdpbml0aWFsJyB8ICd2aXNpYmxlJyB8ICdoaWRkZW4nO1xuXG4vKiogVGltZSBpbiBtcyB0byB0aHJvdHRsZSByZXBvc2l0aW9uaW5nIGFmdGVyIHNjcm9sbCBldmVudHMuICovXG5leHBvcnQgY29uc3QgU0NST0xMX1RIUk9UVExFX01TID0gMjA7XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBlcnJvciB0byBiZSB0aHJvd24gaWYgdGhlIHVzZXIgc3VwcGxpZWQgYW4gaW52YWxpZCB0b29sdGlwIHBvc2l0aW9uLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TWF0VG9vbHRpcEludmFsaWRQb3NpdGlvbkVycm9yKHBvc2l0aW9uOiBzdHJpbmcpIHtcbiAgcmV0dXJuIEVycm9yKGBUb29sdGlwIHBvc2l0aW9uIFwiJHtwb3NpdGlvbn1cIiBpcyBpbnZhbGlkLmApO1xufVxuXG4vKiogSW5qZWN0aW9uIHRva2VuIHRoYXQgZGV0ZXJtaW5lcyB0aGUgc2Nyb2xsIGhhbmRsaW5nIHdoaWxlIGEgdG9vbHRpcCBpcyB2aXNpYmxlLiAqL1xuZXhwb3J0IGNvbnN0IE1BVF9UT09MVElQX1NDUk9MTF9TVFJBVEVHWSA9IG5ldyBJbmplY3Rpb25Ub2tlbjwoKSA9PiBTY3JvbGxTdHJhdGVneT4oXG4gICdtYXQtdG9vbHRpcC1zY3JvbGwtc3RyYXRlZ3knLFxuICB7XG4gICAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxuICAgIGZhY3Rvcnk6ICgpID0+IHtcbiAgICAgIGNvbnN0IG92ZXJsYXkgPSBpbmplY3QoT3ZlcmxheSk7XG4gICAgICByZXR1cm4gKCkgPT4gb3ZlcmxheS5zY3JvbGxTdHJhdGVnaWVzLnJlcG9zaXRpb24oe3Njcm9sbFRocm90dGxlOiBTQ1JPTExfVEhST1RUTEVfTVN9KTtcbiAgICB9LFxuICB9LFxuKTtcblxuLyoqIEBkb2NzLXByaXZhdGUgKi9cbmV4cG9ydCBmdW5jdGlvbiBNQVRfVE9PTFRJUF9TQ1JPTExfU1RSQVRFR1lfRkFDVE9SWShvdmVybGF5OiBPdmVybGF5KTogKCkgPT4gU2Nyb2xsU3RyYXRlZ3kge1xuICByZXR1cm4gKCkgPT4gb3ZlcmxheS5zY3JvbGxTdHJhdGVnaWVzLnJlcG9zaXRpb24oe3Njcm9sbFRocm90dGxlOiBTQ1JPTExfVEhST1RUTEVfTVN9KTtcbn1cblxuLyoqIEBkb2NzLXByaXZhdGUgKi9cbmV4cG9ydCBjb25zdCBNQVRfVE9PTFRJUF9TQ1JPTExfU1RSQVRFR1lfRkFDVE9SWV9QUk9WSURFUiA9IHtcbiAgcHJvdmlkZTogTUFUX1RPT0xUSVBfU0NST0xMX1NUUkFURUdZLFxuICBkZXBzOiBbT3ZlcmxheV0sXG4gIHVzZUZhY3Rvcnk6IE1BVF9UT09MVElQX1NDUk9MTF9TVFJBVEVHWV9GQUNUT1JZLFxufTtcblxuLyoqIEBkb2NzLXByaXZhdGUgKi9cbmV4cG9ydCBmdW5jdGlvbiBNQVRfVE9PTFRJUF9ERUZBVUxUX09QVElPTlNfRkFDVE9SWSgpOiBNYXRUb29sdGlwRGVmYXVsdE9wdGlvbnMge1xuICByZXR1cm4ge1xuICAgIHNob3dEZWxheTogMCxcbiAgICBoaWRlRGVsYXk6IDAsXG4gICAgdG91Y2hlbmRIaWRlRGVsYXk6IDE1MDAsXG4gIH07XG59XG5cbi8qKiBJbmplY3Rpb24gdG9rZW4gdG8gYmUgdXNlZCB0byBvdmVycmlkZSB0aGUgZGVmYXVsdCBvcHRpb25zIGZvciBgbWF0VG9vbHRpcGAuICovXG5leHBvcnQgY29uc3QgTUFUX1RPT0xUSVBfREVGQVVMVF9PUFRJT05TID0gbmV3IEluamVjdGlvblRva2VuPE1hdFRvb2x0aXBEZWZhdWx0T3B0aW9ucz4oXG4gICdtYXQtdG9vbHRpcC1kZWZhdWx0LW9wdGlvbnMnLFxuICB7XG4gICAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxuICAgIGZhY3Rvcnk6IE1BVF9UT09MVElQX0RFRkFVTFRfT1BUSU9OU19GQUNUT1JZLFxuICB9LFxuKTtcblxuLyoqIERlZmF1bHQgYG1hdFRvb2x0aXBgIG9wdGlvbnMgdGhhdCBjYW4gYmUgb3ZlcnJpZGRlbi4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTWF0VG9vbHRpcERlZmF1bHRPcHRpb25zIHtcbiAgLyoqIERlZmF1bHQgZGVsYXkgd2hlbiB0aGUgdG9vbHRpcCBpcyBzaG93bi4gKi9cbiAgc2hvd0RlbGF5OiBudW1iZXI7XG5cbiAgLyoqIERlZmF1bHQgZGVsYXkgd2hlbiB0aGUgdG9vbHRpcCBpcyBoaWRkZW4uICovXG4gIGhpZGVEZWxheTogbnVtYmVyO1xuXG4gIC8qKiBEZWZhdWx0IGRlbGF5IHdoZW4gaGlkaW5nIHRoZSB0b29sdGlwIG9uIGEgdG91Y2ggZGV2aWNlLiAqL1xuICB0b3VjaGVuZEhpZGVEZWxheTogbnVtYmVyO1xuXG4gIC8qKiBUaW1lIGJldHdlZW4gdGhlIHVzZXIgcHV0dGluZyB0aGUgcG9pbnRlciBvbiBhIHRvb2x0aXAgdHJpZ2dlciBhbmQgdGhlIGxvbmcgcHJlc3MgZXZlbnQgYmVpbmcgZmlyZWQgb24gYSB0b3VjaCBkZXZpY2UuICovXG4gIHRvdWNoTG9uZ1ByZXNzU2hvd0RlbGF5PzogbnVtYmVyO1xuXG4gIC8qKiBEZWZhdWx0IHRvdWNoIGdlc3R1cmUgaGFuZGxpbmcgZm9yIHRvb2x0aXBzLiAqL1xuICB0b3VjaEdlc3R1cmVzPzogVG9vbHRpcFRvdWNoR2VzdHVyZXM7XG5cbiAgLyoqIERlZmF1bHQgcG9zaXRpb24gZm9yIHRvb2x0aXBzLiAqL1xuICBwb3NpdGlvbj86IFRvb2x0aXBQb3NpdGlvbjtcblxuICAvKipcbiAgICogRGVmYXVsdCB2YWx1ZSBmb3Igd2hldGhlciB0b29sdGlwcyBzaG91bGQgYmUgcG9zaXRpb25lZCBuZWFyIHRoZSBjbGljayBvciB0b3VjaCBvcmlnaW5cbiAgICogaW5zdGVhZCBvZiBvdXRzaWRlIHRoZSBlbGVtZW50IGJvdW5kaW5nIGJveC5cbiAgICovXG4gIHBvc2l0aW9uQXRPcmlnaW4/OiBib29sZWFuO1xuXG4gIC8qKiBEaXNhYmxlcyB0aGUgYWJpbGl0eSBmb3IgdGhlIHVzZXIgdG8gaW50ZXJhY3Qgd2l0aCB0aGUgdG9vbHRpcCBlbGVtZW50LiAqL1xuICBkaXNhYmxlVG9vbHRpcEludGVyYWN0aXZpdHk/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBEZWZhdWx0IGNsYXNzZXMgdG8gYmUgYXBwbGllZCB0byB0aGUgdG9vbHRpcC4gVGhlc2UgZGVmYXVsdCBjbGFzc2VzIHdpbGwgbm90IGJlIGFwcGxpZWQgaWZcbiAgICogYHRvb2x0aXBDbGFzc2AgaXMgZGVmaW5lZCBkaXJlY3RseSBvbiB0aGUgdG9vbHRpcCBlbGVtZW50LCBhcyBpdCB3aWxsIG92ZXJyaWRlIHRoZSBkZWZhdWx0LlxuICAgKi9cbiAgdG9vbHRpcENsYXNzPzogc3RyaW5nIHwgc3RyaW5nW107XG59XG5cbi8qKlxuICogQ1NTIGNsYXNzIHRoYXQgd2lsbCBiZSBhdHRhY2hlZCB0byB0aGUgb3ZlcmxheSBwYW5lbC5cbiAqIEBkZXByZWNhdGVkXG4gKiBAYnJlYWtpbmctY2hhbmdlIDEzLjAuMCByZW1vdmUgdGhpcyB2YXJpYWJsZVxuICovXG5leHBvcnQgY29uc3QgVE9PTFRJUF9QQU5FTF9DTEFTUyA9ICdtYXQtbWRjLXRvb2x0aXAtcGFuZWwnO1xuXG5jb25zdCBQQU5FTF9DTEFTUyA9ICd0b29sdGlwLXBhbmVsJztcblxuLyoqIE9wdGlvbnMgdXNlZCB0byBiaW5kIHBhc3NpdmUgZXZlbnQgbGlzdGVuZXJzLiAqL1xuY29uc3QgcGFzc2l2ZUxpc3RlbmVyT3B0aW9ucyA9IG5vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnMoe3Bhc3NpdmU6IHRydWV9KTtcblxuLy8gVGhlc2UgY29uc3RhbnRzIHdlcmUgdGFrZW4gZnJvbSBNREMncyBgbnVtYmVyc2Agb2JqZWN0LiBXZSBjYW4ndCBpbXBvcnQgdGhlbSBmcm9tIE1EQyxcbi8vIGJlY2F1c2UgdGhleSBoYXZlIHNvbWUgdG9wLWxldmVsIHJlZmVyZW5jZXMgdG8gYHdpbmRvd2Agd2hpY2ggYnJlYWsgZHVyaW5nIFNTUi5cbmNvbnN0IE1JTl9WSUVXUE9SVF9UT09MVElQX1RIUkVTSE9MRCA9IDg7XG5jb25zdCBVTkJPVU5ERURfQU5DSE9SX0dBUCA9IDg7XG5jb25zdCBNSU5fSEVJR0hUID0gMjQ7XG5jb25zdCBNQVhfV0lEVEggPSAyMDA7XG5cbi8qKlxuICogRGlyZWN0aXZlIHRoYXQgYXR0YWNoZXMgYSBtYXRlcmlhbCBkZXNpZ24gdG9vbHRpcCB0byB0aGUgaG9zdCBlbGVtZW50LiBBbmltYXRlcyB0aGUgc2hvd2luZyBhbmRcbiAqIGhpZGluZyBvZiBhIHRvb2x0aXAgcHJvdmlkZWQgcG9zaXRpb24gKGRlZmF1bHRzIHRvIGJlbG93IHRoZSBlbGVtZW50KS5cbiAqXG4gKiBodHRwczovL21hdGVyaWFsLmlvL2Rlc2lnbi9jb21wb25lbnRzL3Rvb2x0aXBzLmh0bWxcbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW21hdFRvb2x0aXBdJyxcbiAgZXhwb3J0QXM6ICdtYXRUb29sdGlwJyxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdtYXQtbWRjLXRvb2x0aXAtdHJpZ2dlcicsXG4gICAgJ1tjbGFzcy5tYXQtbWRjLXRvb2x0aXAtZGlzYWJsZWRdJzogJ2Rpc2FibGVkJyxcbiAgfSxcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcbn0pXG5leHBvcnQgY2xhc3MgTWF0VG9vbHRpcCBpbXBsZW1lbnRzIE9uRGVzdHJveSwgQWZ0ZXJWaWV3SW5pdCB7XG4gIF9vdmVybGF5UmVmOiBPdmVybGF5UmVmIHwgbnVsbDtcbiAgX3Rvb2x0aXBJbnN0YW5jZTogVG9vbHRpcENvbXBvbmVudCB8IG51bGw7XG5cbiAgcHJpdmF0ZSBfcG9ydGFsOiBDb21wb25lbnRQb3J0YWw8VG9vbHRpcENvbXBvbmVudD47XG4gIHByaXZhdGUgX3Bvc2l0aW9uOiBUb29sdGlwUG9zaXRpb24gPSAnYmVsb3cnO1xuICBwcml2YXRlIF9wb3NpdGlvbkF0T3JpZ2luOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgX2Rpc2FibGVkOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgX3Rvb2x0aXBDbGFzczogc3RyaW5nIHwgc3RyaW5nW10gfCBTZXQ8c3RyaW5nPiB8IHtba2V5OiBzdHJpbmddOiBhbnl9O1xuICBwcml2YXRlIF9zY3JvbGxTdHJhdGVneTogKCkgPT4gU2Nyb2xsU3RyYXRlZ3k7XG4gIHByaXZhdGUgX3ZpZXdJbml0aWFsaXplZCA9IGZhbHNlO1xuICBwcml2YXRlIF9wb2ludGVyRXhpdEV2ZW50c0luaXRpYWxpemVkID0gZmFsc2U7XG4gIHByaXZhdGUgcmVhZG9ubHkgX3Rvb2x0aXBDb21wb25lbnQgPSBUb29sdGlwQ29tcG9uZW50O1xuICBwcml2YXRlIF92aWV3cG9ydE1hcmdpbiA9IDg7XG4gIHByaXZhdGUgX2N1cnJlbnRQb3NpdGlvbjogVG9vbHRpcFBvc2l0aW9uO1xuICBwcml2YXRlIHJlYWRvbmx5IF9jc3NDbGFzc1ByZWZpeDogc3RyaW5nID0gJ21hdC1tZGMnO1xuICBwcml2YXRlIF9hcmlhRGVzY3JpcHRpb25QZW5kaW5nOiBib29sZWFuO1xuXG4gIC8qKiBBbGxvd3MgdGhlIHVzZXIgdG8gZGVmaW5lIHRoZSBwb3NpdGlvbiBvZiB0aGUgdG9vbHRpcCByZWxhdGl2ZSB0byB0aGUgcGFyZW50IGVsZW1lbnQgKi9cbiAgQElucHV0KCdtYXRUb29sdGlwUG9zaXRpb24nKVxuICBnZXQgcG9zaXRpb24oKTogVG9vbHRpcFBvc2l0aW9uIHtcbiAgICByZXR1cm4gdGhpcy5fcG9zaXRpb247XG4gIH1cblxuICBzZXQgcG9zaXRpb24odmFsdWU6IFRvb2x0aXBQb3NpdGlvbikge1xuICAgIGlmICh2YWx1ZSAhPT0gdGhpcy5fcG9zaXRpb24pIHtcbiAgICAgIHRoaXMuX3Bvc2l0aW9uID0gdmFsdWU7XG5cbiAgICAgIGlmICh0aGlzLl9vdmVybGF5UmVmKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZVBvc2l0aW9uKHRoaXMuX292ZXJsYXlSZWYpO1xuICAgICAgICB0aGlzLl90b29sdGlwSW5zdGFuY2U/LnNob3coMCk7XG4gICAgICAgIHRoaXMuX292ZXJsYXlSZWYudXBkYXRlUG9zaXRpb24oKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciB0b29sdGlwIHNob3VsZCBiZSByZWxhdGl2ZSB0byB0aGUgY2xpY2sgb3IgdG91Y2ggb3JpZ2luXG4gICAqIGluc3RlYWQgb2Ygb3V0c2lkZSB0aGUgZWxlbWVudCBib3VuZGluZyBib3guXG4gICAqL1xuICBASW5wdXQoJ21hdFRvb2x0aXBQb3NpdGlvbkF0T3JpZ2luJylcbiAgZ2V0IHBvc2l0aW9uQXRPcmlnaW4oKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX3Bvc2l0aW9uQXRPcmlnaW47XG4gIH1cblxuICBzZXQgcG9zaXRpb25BdE9yaWdpbih2YWx1ZTogQm9vbGVhbklucHV0KSB7XG4gICAgdGhpcy5fcG9zaXRpb25BdE9yaWdpbiA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG4gICAgdGhpcy5fZGV0YWNoKCk7XG4gICAgdGhpcy5fb3ZlcmxheVJlZiA9IG51bGw7XG4gIH1cblxuICAvKiogRGlzYWJsZXMgdGhlIGRpc3BsYXkgb2YgdGhlIHRvb2x0aXAuICovXG4gIEBJbnB1dCgnbWF0VG9vbHRpcERpc2FibGVkJylcbiAgZ2V0IGRpc2FibGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9kaXNhYmxlZDtcbiAgfVxuXG4gIHNldCBkaXNhYmxlZCh2YWx1ZTogQm9vbGVhbklucHV0KSB7XG4gICAgY29uc3QgaXNEaXNhYmxlZCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG5cbiAgICBpZiAodGhpcy5fZGlzYWJsZWQgIT09IGlzRGlzYWJsZWQpIHtcbiAgICAgIHRoaXMuX2Rpc2FibGVkID0gaXNEaXNhYmxlZDtcblxuICAgICAgLy8gSWYgdG9vbHRpcCBpcyBkaXNhYmxlZCwgaGlkZSBpbW1lZGlhdGVseS5cbiAgICAgIGlmIChpc0Rpc2FibGVkKSB7XG4gICAgICAgIHRoaXMuaGlkZSgwKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3NldHVwUG9pbnRlckVudGVyRXZlbnRzSWZOZWVkZWQoKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fc3luY0FyaWFEZXNjcmlwdGlvbih0aGlzLm1lc3NhZ2UpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBUaGUgZGVmYXVsdCBkZWxheSBpbiBtcyBiZWZvcmUgc2hvd2luZyB0aGUgdG9vbHRpcCBhZnRlciBzaG93IGlzIGNhbGxlZCAqL1xuICBASW5wdXQoJ21hdFRvb2x0aXBTaG93RGVsYXknKVxuICBnZXQgc2hvd0RlbGF5KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3Nob3dEZWxheTtcbiAgfVxuXG4gIHNldCBzaG93RGVsYXkodmFsdWU6IE51bWJlcklucHV0KSB7XG4gICAgdGhpcy5fc2hvd0RlbGF5ID0gY29lcmNlTnVtYmVyUHJvcGVydHkodmFsdWUpO1xuICB9XG5cbiAgcHJpdmF0ZSBfc2hvd0RlbGF5OiBudW1iZXI7XG5cbiAgLyoqIFRoZSBkZWZhdWx0IGRlbGF5IGluIG1zIGJlZm9yZSBoaWRpbmcgdGhlIHRvb2x0aXAgYWZ0ZXIgaGlkZSBpcyBjYWxsZWQgKi9cbiAgQElucHV0KCdtYXRUb29sdGlwSGlkZURlbGF5JylcbiAgZ2V0IGhpZGVEZWxheSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9oaWRlRGVsYXk7XG4gIH1cblxuICBzZXQgaGlkZURlbGF5KHZhbHVlOiBOdW1iZXJJbnB1dCkge1xuICAgIHRoaXMuX2hpZGVEZWxheSA9IGNvZXJjZU51bWJlclByb3BlcnR5KHZhbHVlKTtcblxuICAgIGlmICh0aGlzLl90b29sdGlwSW5zdGFuY2UpIHtcbiAgICAgIHRoaXMuX3Rvb2x0aXBJbnN0YW5jZS5fbW91c2VMZWF2ZUhpZGVEZWxheSA9IHRoaXMuX2hpZGVEZWxheTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9oaWRlRGVsYXk6IG51bWJlcjtcblxuICAvKipcbiAgICogSG93IHRvdWNoIGdlc3R1cmVzIHNob3VsZCBiZSBoYW5kbGVkIGJ5IHRoZSB0b29sdGlwLiBPbiB0b3VjaCBkZXZpY2VzIHRoZSB0b29sdGlwIGRpcmVjdGl2ZVxuICAgKiB1c2VzIGEgbG9uZyBwcmVzcyBnZXN0dXJlIHRvIHNob3cgYW5kIGhpZGUsIGhvd2V2ZXIgaXQgY2FuIGNvbmZsaWN0IHdpdGggdGhlIG5hdGl2ZSBicm93c2VyXG4gICAqIGdlc3R1cmVzLiBUbyB3b3JrIGFyb3VuZCB0aGUgY29uZmxpY3QsIEFuZ3VsYXIgTWF0ZXJpYWwgZGlzYWJsZXMgbmF0aXZlIGdlc3R1cmVzIG9uIHRoZVxuICAgKiB0cmlnZ2VyLCBidXQgdGhhdCBtaWdodCBub3QgYmUgZGVzaXJhYmxlIG9uIHBhcnRpY3VsYXIgZWxlbWVudHMgKGUuZy4gaW5wdXRzIGFuZCBkcmFnZ2FibGVcbiAgICogZWxlbWVudHMpLiBUaGUgZGlmZmVyZW50IHZhbHVlcyBmb3IgdGhpcyBvcHRpb24gY29uZmlndXJlIHRoZSB0b3VjaCBldmVudCBoYW5kbGluZyBhcyBmb2xsb3dzOlxuICAgKiAtIGBhdXRvYCAtIEVuYWJsZXMgdG91Y2ggZ2VzdHVyZXMgZm9yIGFsbCBlbGVtZW50cywgYnV0IHRyaWVzIHRvIGF2b2lkIGNvbmZsaWN0cyB3aXRoIG5hdGl2ZVxuICAgKiAgIGJyb3dzZXIgZ2VzdHVyZXMgb24gcGFydGljdWxhciBlbGVtZW50cy4gSW4gcGFydGljdWxhciwgaXQgYWxsb3dzIHRleHQgc2VsZWN0aW9uIG9uIGlucHV0c1xuICAgKiAgIGFuZCB0ZXh0YXJlYXMsIGFuZCBwcmVzZXJ2ZXMgdGhlIG5hdGl2ZSBicm93c2VyIGRyYWdnaW5nIG9uIGVsZW1lbnRzIG1hcmtlZCBhcyBgZHJhZ2dhYmxlYC5cbiAgICogLSBgb25gIC0gRW5hYmxlcyB0b3VjaCBnZXN0dXJlcyBmb3IgYWxsIGVsZW1lbnRzIGFuZCBkaXNhYmxlcyBuYXRpdmVcbiAgICogICBicm93c2VyIGdlc3R1cmVzIHdpdGggbm8gZXhjZXB0aW9ucy5cbiAgICogLSBgb2ZmYCAtIERpc2FibGVzIHRvdWNoIGdlc3R1cmVzLiBOb3RlIHRoYXQgdGhpcyB3aWxsIHByZXZlbnQgdGhlIHRvb2x0aXAgZnJvbVxuICAgKiAgIHNob3dpbmcgb24gdG91Y2ggZGV2aWNlcy5cbiAgICovXG4gIEBJbnB1dCgnbWF0VG9vbHRpcFRvdWNoR2VzdHVyZXMnKSB0b3VjaEdlc3R1cmVzOiBUb29sdGlwVG91Y2hHZXN0dXJlcyA9ICdhdXRvJztcblxuICAvKiogVGhlIG1lc3NhZ2UgdG8gYmUgZGlzcGxheWVkIGluIHRoZSB0b29sdGlwICovXG4gIEBJbnB1dCgnbWF0VG9vbHRpcCcpXG4gIGdldCBtZXNzYWdlKCk6IHN0cmluZyB7XG4gICAgY29uc29sZS5sb2coJ1Rlc3QgT3V0cHV0Jyk7XG4gICAgcmV0dXJuIHRoaXMuX21lc3NhZ2U7XG4gIH1cblxuICBzZXQgbWVzc2FnZSh2YWx1ZTogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0IG9sZE1lc3NhZ2UgPSB0aGlzLl9tZXNzYWdlO1xuXG4gICAgLy8gSWYgdGhlIG1lc3NhZ2UgaXMgbm90IGEgc3RyaW5nIChlLmcuIG51bWJlciksIGNvbnZlcnQgaXQgdG8gYSBzdHJpbmcgYW5kIHRyaW0gaXQuXG4gICAgLy8gTXVzdCBjb252ZXJ0IHdpdGggYFN0cmluZyh2YWx1ZSlgLCBub3QgYCR7dmFsdWV9YCwgb3RoZXJ3aXNlIENsb3N1cmUgQ29tcGlsZXIgb3B0aW1pc2VzXG4gICAgLy8gYXdheSB0aGUgc3RyaW5nLWNvbnZlcnNpb246IGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2NvbXBvbmVudHMvaXNzdWVzLzIwNjg0XG4gICAgdGhpcy5fbWVzc2FnZSA9IHZhbHVlICE9IG51bGwgPyBTdHJpbmcodmFsdWUpLnRyaW0oKSA6ICcnO1xuXG4gICAgaWYgKCF0aGlzLl9tZXNzYWdlICYmIHRoaXMuX2lzVG9vbHRpcFZpc2libGUoKSkge1xuICAgICAgdGhpcy5oaWRlKDApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9zZXR1cFBvaW50ZXJFbnRlckV2ZW50c0lmTmVlZGVkKCk7XG4gICAgICB0aGlzLl91cGRhdGVUb29sdGlwTWVzc2FnZSgpO1xuICAgIH1cblxuICAgIHRoaXMuX3N5bmNBcmlhRGVzY3JpcHRpb24ob2xkTWVzc2FnZSk7XG4gIH1cblxuICBwcml2YXRlIF9tZXNzYWdlID0gJyc7XG5cbiAgLyoqIENsYXNzZXMgdG8gYmUgcGFzc2VkIHRvIHRoZSB0b29sdGlwLiBTdXBwb3J0cyB0aGUgc2FtZSBzeW50YXggYXMgYG5nQ2xhc3NgLiAqL1xuICBASW5wdXQoJ21hdFRvb2x0aXBDbGFzcycpXG4gIGdldCB0b29sdGlwQ2xhc3MoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Rvb2x0aXBDbGFzcztcbiAgfVxuXG4gIHNldCB0b29sdGlwQ2xhc3ModmFsdWU6IHN0cmluZyB8IHN0cmluZ1tdIHwgU2V0PHN0cmluZz4gfCB7W2tleTogc3RyaW5nXTogYW55fSkge1xuICAgIHRoaXMuX3Rvb2x0aXBDbGFzcyA9IHZhbHVlO1xuICAgIGlmICh0aGlzLl90b29sdGlwSW5zdGFuY2UpIHtcbiAgICAgIHRoaXMuX3NldFRvb2x0aXBDbGFzcyh0aGlzLl90b29sdGlwQ2xhc3MpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBNYW51YWxseS1ib3VuZCBwYXNzaXZlIGV2ZW50IGxpc3RlbmVycy4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfcGFzc2l2ZUxpc3RlbmVyczogKHJlYWRvbmx5IFtzdHJpbmcsIEV2ZW50TGlzdGVuZXJPckV2ZW50TGlzdGVuZXJPYmplY3RdKVtdID1cbiAgICBbXTtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IGRvY3VtZW50LiAqL1xuICBwcml2YXRlIF9kb2N1bWVudDogRG9jdW1lbnQ7XG5cbiAgLyoqIFRpbWVyIHN0YXJ0ZWQgYXQgdGhlIGxhc3QgYHRvdWNoc3RhcnRgIGV2ZW50LiAqL1xuICBwcml2YXRlIF90b3VjaHN0YXJ0VGltZW91dDogbnVsbCB8IFJldHVyblR5cGU8dHlwZW9mIHNldFRpbWVvdXQ+ID0gbnVsbDtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgY29tcG9uZW50IGlzIGRlc3Ryb3llZC4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfZGVzdHJveWVkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICBwcml2YXRlIF9pbmplY3RvciA9IGluamVjdChJbmplY3Rvcik7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfb3ZlcmxheTogT3ZlcmxheSxcbiAgICBwcml2YXRlIF9lbGVtZW50UmVmOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICBwcml2YXRlIF9zY3JvbGxEaXNwYXRjaGVyOiBTY3JvbGxEaXNwYXRjaGVyLFxuICAgIHByaXZhdGUgX3ZpZXdDb250YWluZXJSZWY6IFZpZXdDb250YWluZXJSZWYsXG4gICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgcHJpdmF0ZSBfcGxhdGZvcm06IFBsYXRmb3JtLFxuICAgIHByaXZhdGUgX2FyaWFEZXNjcmliZXI6IEFyaWFEZXNjcmliZXIsXG4gICAgcHJpdmF0ZSBfZm9jdXNNb25pdG9yOiBGb2N1c01vbml0b3IsXG4gICAgQEluamVjdChNQVRfVE9PTFRJUF9TQ1JPTExfU1RSQVRFR1kpIHNjcm9sbFN0cmF0ZWd5OiBhbnksXG4gICAgcHJvdGVjdGVkIF9kaXI6IERpcmVjdGlvbmFsaXR5LFxuICAgIEBPcHRpb25hbCgpXG4gICAgQEluamVjdChNQVRfVE9PTFRJUF9ERUZBVUxUX09QVElPTlMpXG4gICAgcHJpdmF0ZSBfZGVmYXVsdE9wdGlvbnM6IE1hdFRvb2x0aXBEZWZhdWx0T3B0aW9ucyxcbiAgICBASW5qZWN0KERPQ1VNRU5UKSBfZG9jdW1lbnQ6IGFueSxcbiAgKSB7XG4gICAgdGhpcy5fc2Nyb2xsU3RyYXRlZ3kgPSBzY3JvbGxTdHJhdGVneTtcbiAgICB0aGlzLl9kb2N1bWVudCA9IF9kb2N1bWVudDtcblxuICAgIGlmIChfZGVmYXVsdE9wdGlvbnMpIHtcbiAgICAgIHRoaXMuX3Nob3dEZWxheSA9IF9kZWZhdWx0T3B0aW9ucy5zaG93RGVsYXk7XG4gICAgICB0aGlzLl9oaWRlRGVsYXkgPSBfZGVmYXVsdE9wdGlvbnMuaGlkZURlbGF5O1xuXG4gICAgICBpZiAoX2RlZmF1bHRPcHRpb25zLnBvc2l0aW9uKSB7XG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBfZGVmYXVsdE9wdGlvbnMucG9zaXRpb247XG4gICAgICB9XG5cbiAgICAgIGlmIChfZGVmYXVsdE9wdGlvbnMucG9zaXRpb25BdE9yaWdpbikge1xuICAgICAgICB0aGlzLnBvc2l0aW9uQXRPcmlnaW4gPSBfZGVmYXVsdE9wdGlvbnMucG9zaXRpb25BdE9yaWdpbjtcbiAgICAgIH1cblxuICAgICAgaWYgKF9kZWZhdWx0T3B0aW9ucy50b3VjaEdlc3R1cmVzKSB7XG4gICAgICAgIHRoaXMudG91Y2hHZXN0dXJlcyA9IF9kZWZhdWx0T3B0aW9ucy50b3VjaEdlc3R1cmVzO1xuICAgICAgfVxuXG4gICAgICBpZiAoX2RlZmF1bHRPcHRpb25zLnRvb2x0aXBDbGFzcykge1xuICAgICAgICB0aGlzLnRvb2x0aXBDbGFzcyA9IF9kZWZhdWx0T3B0aW9ucy50b29sdGlwQ2xhc3M7XG4gICAgICB9XG4gICAgfVxuXG4gICAgX2Rpci5jaGFuZ2UucGlwZSh0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKSkuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLl9vdmVybGF5UmVmKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZVBvc2l0aW9uKHRoaXMuX292ZXJsYXlSZWYpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5fdmlld3BvcnRNYXJnaW4gPSBNSU5fVklFV1BPUlRfVE9PTFRJUF9USFJFU0hPTEQ7XG4gIH1cblxuICBuZ0FmdGVyVmlld0luaXQoKSB7XG4gICAgLy8gVGhpcyBuZWVkcyB0byBoYXBwZW4gYWZ0ZXIgdmlldyBpbml0IHNvIHRoZSBpbml0aWFsIHZhbHVlcyBmb3IgYWxsIGlucHV0cyBoYXZlIGJlZW4gc2V0LlxuICAgIHRoaXMuX3ZpZXdJbml0aWFsaXplZCA9IHRydWU7XG4gICAgdGhpcy5fc2V0dXBQb2ludGVyRW50ZXJFdmVudHNJZk5lZWRlZCgpO1xuXG4gICAgdGhpcy5fZm9jdXNNb25pdG9yXG4gICAgICAubW9uaXRvcih0aGlzLl9lbGVtZW50UmVmKVxuICAgICAgLnBpcGUodGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCkpXG4gICAgICAuc3Vic2NyaWJlKG9yaWdpbiA9PiB7XG4gICAgICAgIC8vIE5vdGUgdGhhdCB0aGUgZm9jdXMgbW9uaXRvciBydW5zIG91dHNpZGUgdGhlIEFuZ3VsYXIgem9uZS5cbiAgICAgICAgaWYgKCFvcmlnaW4pIHtcbiAgICAgICAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHRoaXMuaGlkZSgwKSk7XG4gICAgICAgIH0gZWxzZSBpZiAob3JpZ2luID09PSAna2V5Ym9hcmQnKSB7XG4gICAgICAgICAgdGhpcy5fbmdab25lLnJ1bigoKSA9PiB0aGlzLnNob3coKSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERpc3Bvc2UgdGhlIHRvb2x0aXAgd2hlbiBkZXN0cm95ZWQuXG4gICAqL1xuICBuZ09uRGVzdHJveSgpIHtcbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50O1xuXG4gICAgLy8gT3B0aW1pemF0aW9uOiBEbyBub3QgY2FsbCBjbGVhclRpbWVvdXQgdW5sZXNzIHRoZXJlIGlzIGFuIGFjdGl2ZSB0aW1lci5cbiAgICBpZiAodGhpcy5fdG91Y2hzdGFydFRpbWVvdXQpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl90b3VjaHN0YXJ0VGltZW91dCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX292ZXJsYXlSZWYpIHtcbiAgICAgIHRoaXMuX292ZXJsYXlSZWYuZGlzcG9zZSgpO1xuICAgICAgdGhpcy5fdG9vbHRpcEluc3RhbmNlID0gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBDbGVhbiB1cCB0aGUgZXZlbnQgbGlzdGVuZXJzIHNldCBpbiB0aGUgY29uc3RydWN0b3JcbiAgICB0aGlzLl9wYXNzaXZlTGlzdGVuZXJzLmZvckVhY2goKFtldmVudCwgbGlzdGVuZXJdKSA9PiB7XG4gICAgICBuYXRpdmVFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyLCBwYXNzaXZlTGlzdGVuZXJPcHRpb25zKTtcbiAgICB9KTtcbiAgICB0aGlzLl9wYXNzaXZlTGlzdGVuZXJzLmxlbmd0aCA9IDA7XG5cbiAgICB0aGlzLl9kZXN0cm95ZWQubmV4dCgpO1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5jb21wbGV0ZSgpO1xuXG4gICAgdGhpcy5fYXJpYURlc2NyaWJlci5yZW1vdmVEZXNjcmlwdGlvbihuYXRpdmVFbGVtZW50LCB0aGlzLm1lc3NhZ2UsICd0b29sdGlwJyk7XG4gICAgdGhpcy5fZm9jdXNNb25pdG9yLnN0b3BNb25pdG9yaW5nKG5hdGl2ZUVsZW1lbnQpO1xuICB9XG5cbiAgLyoqIFNob3dzIHRoZSB0b29sdGlwIGFmdGVyIHRoZSBkZWxheSBpbiBtcywgZGVmYXVsdHMgdG8gdG9vbHRpcC1kZWxheS1zaG93IG9yIDBtcyBpZiBubyBpbnB1dCAqL1xuICBzaG93KGRlbGF5OiBudW1iZXIgPSB0aGlzLnNob3dEZWxheSwgb3JpZ2luPzoge3g6IG51bWJlcjsgeTogbnVtYmVyfSk6IHZvaWQge1xuICAgIGlmICh0aGlzLmRpc2FibGVkIHx8ICF0aGlzLm1lc3NhZ2UgfHwgdGhpcy5faXNUb29sdGlwVmlzaWJsZSgpKSB7XG4gICAgICB0aGlzLl90b29sdGlwSW5zdGFuY2U/Ll9jYW5jZWxQZW5kaW5nQW5pbWF0aW9ucygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG92ZXJsYXlSZWYgPSB0aGlzLl9jcmVhdGVPdmVybGF5KG9yaWdpbik7XG4gICAgdGhpcy5fZGV0YWNoKCk7XG4gICAgdGhpcy5fcG9ydGFsID1cbiAgICAgIHRoaXMuX3BvcnRhbCB8fCBuZXcgQ29tcG9uZW50UG9ydGFsKHRoaXMuX3Rvb2x0aXBDb21wb25lbnQsIHRoaXMuX3ZpZXdDb250YWluZXJSZWYpO1xuICAgIGNvbnN0IGluc3RhbmNlID0gKHRoaXMuX3Rvb2x0aXBJbnN0YW5jZSA9IG92ZXJsYXlSZWYuYXR0YWNoKHRoaXMuX3BvcnRhbCkuaW5zdGFuY2UpO1xuICAgIGluc3RhbmNlLl90cmlnZ2VyRWxlbWVudCA9IHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcbiAgICBpbnN0YW5jZS5fbW91c2VMZWF2ZUhpZGVEZWxheSA9IHRoaXMuX2hpZGVEZWxheTtcbiAgICBpbnN0YW5jZVxuICAgICAgLmFmdGVySGlkZGVuKClcbiAgICAgIC5waXBlKHRha2VVbnRpbCh0aGlzLl9kZXN0cm95ZWQpKVxuICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLl9kZXRhY2goKSk7XG4gICAgdGhpcy5fc2V0VG9vbHRpcENsYXNzKHRoaXMuX3Rvb2x0aXBDbGFzcyk7XG4gICAgdGhpcy5fdXBkYXRlVG9vbHRpcE1lc3NhZ2UoKTtcbiAgICBpbnN0YW5jZS5zaG93KGRlbGF5KTtcbiAgfVxuXG4gIC8qKiBIaWRlcyB0aGUgdG9vbHRpcCBhZnRlciB0aGUgZGVsYXkgaW4gbXMsIGRlZmF1bHRzIHRvIHRvb2x0aXAtZGVsYXktaGlkZSBvciAwbXMgaWYgbm8gaW5wdXQgKi9cbiAgaGlkZShkZWxheTogbnVtYmVyID0gdGhpcy5oaWRlRGVsYXkpOiB2b2lkIHtcbiAgICBjb25zdCBpbnN0YW5jZSA9IHRoaXMuX3Rvb2x0aXBJbnN0YW5jZTtcblxuICAgIGlmIChpbnN0YW5jZSkge1xuICAgICAgaWYgKGluc3RhbmNlLmlzVmlzaWJsZSgpKSB7XG4gICAgICAgIGluc3RhbmNlLmhpZGUoZGVsYXkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW5zdGFuY2UuX2NhbmNlbFBlbmRpbmdBbmltYXRpb25zKCk7XG4gICAgICAgIHRoaXMuX2RldGFjaCgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBTaG93cy9oaWRlcyB0aGUgdG9vbHRpcCAqL1xuICB0b2dnbGUob3JpZ2luPzoge3g6IG51bWJlcjsgeTogbnVtYmVyfSk6IHZvaWQge1xuICAgIHRoaXMuX2lzVG9vbHRpcFZpc2libGUoKSA/IHRoaXMuaGlkZSgpIDogdGhpcy5zaG93KHVuZGVmaW5lZCwgb3JpZ2luKTtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIHRydWUgaWYgdGhlIHRvb2x0aXAgaXMgY3VycmVudGx5IHZpc2libGUgdG8gdGhlIHVzZXIgKi9cbiAgX2lzVG9vbHRpcFZpc2libGUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICEhdGhpcy5fdG9vbHRpcEluc3RhbmNlICYmIHRoaXMuX3Rvb2x0aXBJbnN0YW5jZS5pc1Zpc2libGUoKTtcbiAgfVxuXG4gIC8qKiBDcmVhdGUgdGhlIG92ZXJsYXkgY29uZmlnIGFuZCBwb3NpdGlvbiBzdHJhdGVneSAqL1xuICBwcml2YXRlIF9jcmVhdGVPdmVybGF5KG9yaWdpbj86IHt4OiBudW1iZXI7IHk6IG51bWJlcn0pOiBPdmVybGF5UmVmIHtcbiAgICBpZiAodGhpcy5fb3ZlcmxheVJlZikge1xuICAgICAgY29uc3QgZXhpc3RpbmdTdHJhdGVneSA9IHRoaXMuX292ZXJsYXlSZWYuZ2V0Q29uZmlnKClcbiAgICAgICAgLnBvc2l0aW9uU3RyYXRlZ3kgYXMgRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5O1xuXG4gICAgICBpZiAoKCF0aGlzLnBvc2l0aW9uQXRPcmlnaW4gfHwgIW9yaWdpbikgJiYgZXhpc3RpbmdTdHJhdGVneS5fb3JpZ2luIGluc3RhbmNlb2YgRWxlbWVudFJlZikge1xuICAgICAgICByZXR1cm4gdGhpcy5fb3ZlcmxheVJlZjtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fZGV0YWNoKCk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2Nyb2xsYWJsZUFuY2VzdG9ycyA9IHRoaXMuX3Njcm9sbERpc3BhdGNoZXIuZ2V0QW5jZXN0b3JTY3JvbGxDb250YWluZXJzKFxuICAgICAgdGhpcy5fZWxlbWVudFJlZixcbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIGNvbm5lY3RlZCBwb3NpdGlvbiBzdHJhdGVneSB0aGF0IGxpc3RlbnMgZm9yIHNjcm9sbCBldmVudHMgdG8gcmVwb3NpdGlvbi5cbiAgICBjb25zdCBzdHJhdGVneSA9IHRoaXMuX292ZXJsYXlcbiAgICAgIC5wb3NpdGlvbigpXG4gICAgICAuZmxleGlibGVDb25uZWN0ZWRUbyh0aGlzLnBvc2l0aW9uQXRPcmlnaW4gPyBvcmlnaW4gfHwgdGhpcy5fZWxlbWVudFJlZiA6IHRoaXMuX2VsZW1lbnRSZWYpXG4gICAgICAud2l0aFRyYW5zZm9ybU9yaWdpbk9uKGAuJHt0aGlzLl9jc3NDbGFzc1ByZWZpeH0tdG9vbHRpcGApXG4gICAgICAud2l0aEZsZXhpYmxlRGltZW5zaW9ucyhmYWxzZSlcbiAgICAgIC53aXRoVmlld3BvcnRNYXJnaW4odGhpcy5fdmlld3BvcnRNYXJnaW4pXG4gICAgICAud2l0aFNjcm9sbGFibGVDb250YWluZXJzKHNjcm9sbGFibGVBbmNlc3RvcnMpO1xuXG4gICAgc3RyYXRlZ3kucG9zaXRpb25DaGFuZ2VzLnBpcGUodGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCkpLnN1YnNjcmliZShjaGFuZ2UgPT4ge1xuICAgICAgdGhpcy5fdXBkYXRlQ3VycmVudFBvc2l0aW9uQ2xhc3MoY2hhbmdlLmNvbm5lY3Rpb25QYWlyKTtcblxuICAgICAgaWYgKHRoaXMuX3Rvb2x0aXBJbnN0YW5jZSkge1xuICAgICAgICBpZiAoY2hhbmdlLnNjcm9sbGFibGVWaWV3UHJvcGVydGllcy5pc092ZXJsYXlDbGlwcGVkICYmIHRoaXMuX3Rvb2x0aXBJbnN0YW5jZS5pc1Zpc2libGUoKSkge1xuICAgICAgICAgIC8vIEFmdGVyIHBvc2l0aW9uIGNoYW5nZXMgb2NjdXIgYW5kIHRoZSBvdmVybGF5IGlzIGNsaXBwZWQgYnlcbiAgICAgICAgICAvLyBhIHBhcmVudCBzY3JvbGxhYmxlIHRoZW4gY2xvc2UgdGhlIHRvb2x0aXAuXG4gICAgICAgICAgdGhpcy5fbmdab25lLnJ1bigoKSA9PiB0aGlzLmhpZGUoMCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLl9vdmVybGF5UmVmID0gdGhpcy5fb3ZlcmxheS5jcmVhdGUoe1xuICAgICAgZGlyZWN0aW9uOiB0aGlzLl9kaXIsXG4gICAgICBwb3NpdGlvblN0cmF0ZWd5OiBzdHJhdGVneSxcbiAgICAgIHBhbmVsQ2xhc3M6IGAke3RoaXMuX2Nzc0NsYXNzUHJlZml4fS0ke1BBTkVMX0NMQVNTfWAsXG4gICAgICBzY3JvbGxTdHJhdGVneTogdGhpcy5fc2Nyb2xsU3RyYXRlZ3koKSxcbiAgICB9KTtcblxuICAgIHRoaXMuX3VwZGF0ZVBvc2l0aW9uKHRoaXMuX292ZXJsYXlSZWYpO1xuXG4gICAgdGhpcy5fb3ZlcmxheVJlZlxuICAgICAgLmRldGFjaG1lbnRzKClcbiAgICAgIC5waXBlKHRha2VVbnRpbCh0aGlzLl9kZXN0cm95ZWQpKVxuICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLl9kZXRhY2goKSk7XG5cbiAgICB0aGlzLl9vdmVybGF5UmVmXG4gICAgICAub3V0c2lkZVBvaW50ZXJFdmVudHMoKVxuICAgICAgLnBpcGUodGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCkpXG4gICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMuX3Rvb2x0aXBJbnN0YW5jZT8uX2hhbmRsZUJvZHlJbnRlcmFjdGlvbigpKTtcblxuICAgIHRoaXMuX292ZXJsYXlSZWZcbiAgICAgIC5rZXlkb3duRXZlbnRzKClcbiAgICAgIC5waXBlKHRha2VVbnRpbCh0aGlzLl9kZXN0cm95ZWQpKVxuICAgICAgLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICAgIGlmICh0aGlzLl9pc1Rvb2x0aXBWaXNpYmxlKCkgJiYgZXZlbnQua2V5Q29kZSA9PT0gRVNDQVBFICYmICFoYXNNb2RpZmllcktleShldmVudCkpIHtcbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4gdGhpcy5oaWRlKDApKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICBpZiAodGhpcy5fZGVmYXVsdE9wdGlvbnM/LmRpc2FibGVUb29sdGlwSW50ZXJhY3Rpdml0eSkge1xuICAgICAgdGhpcy5fb3ZlcmxheVJlZi5hZGRQYW5lbENsYXNzKGAke3RoaXMuX2Nzc0NsYXNzUHJlZml4fS10b29sdGlwLXBhbmVsLW5vbi1pbnRlcmFjdGl2ZWApO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9vdmVybGF5UmVmO1xuICB9XG5cbiAgLyoqIERldGFjaGVzIHRoZSBjdXJyZW50bHktYXR0YWNoZWQgdG9vbHRpcC4gKi9cbiAgcHJpdmF0ZSBfZGV0YWNoKCkge1xuICAgIGlmICh0aGlzLl9vdmVybGF5UmVmICYmIHRoaXMuX292ZXJsYXlSZWYuaGFzQXR0YWNoZWQoKSkge1xuICAgICAgdGhpcy5fb3ZlcmxheVJlZi5kZXRhY2goKTtcbiAgICB9XG5cbiAgICB0aGlzLl90b29sdGlwSW5zdGFuY2UgPSBudWxsO1xuICB9XG5cbiAgLyoqIFVwZGF0ZXMgdGhlIHBvc2l0aW9uIG9mIHRoZSBjdXJyZW50IHRvb2x0aXAuICovXG4gIHByaXZhdGUgX3VwZGF0ZVBvc2l0aW9uKG92ZXJsYXlSZWY6IE92ZXJsYXlSZWYpIHtcbiAgICBjb25zdCBwb3NpdGlvbiA9IG92ZXJsYXlSZWYuZ2V0Q29uZmlnKCkucG9zaXRpb25TdHJhdGVneSBhcyBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3k7XG4gICAgY29uc3Qgb3JpZ2luID0gdGhpcy5fZ2V0T3JpZ2luKCk7XG4gICAgY29uc3Qgb3ZlcmxheSA9IHRoaXMuX2dldE92ZXJsYXlQb3NpdGlvbigpO1xuXG4gICAgcG9zaXRpb24ud2l0aFBvc2l0aW9ucyhbXG4gICAgICB0aGlzLl9hZGRPZmZzZXQoey4uLm9yaWdpbi5tYWluLCAuLi5vdmVybGF5Lm1haW59KSxcbiAgICAgIHRoaXMuX2FkZE9mZnNldCh7Li4ub3JpZ2luLmZhbGxiYWNrLCAuLi5vdmVybGF5LmZhbGxiYWNrfSksXG4gICAgXSk7XG4gIH1cblxuICAvKiogQWRkcyB0aGUgY29uZmlndXJlZCBvZmZzZXQgdG8gYSBwb3NpdGlvbi4gVXNlZCBhcyBhIGhvb2sgZm9yIGNoaWxkIGNsYXNzZXMuICovXG4gIHByb3RlY3RlZCBfYWRkT2Zmc2V0KHBvc2l0aW9uOiBDb25uZWN0ZWRQb3NpdGlvbik6IENvbm5lY3RlZFBvc2l0aW9uIHtcbiAgICBjb25zdCBvZmZzZXQgPSBVTkJPVU5ERURfQU5DSE9SX0dBUDtcbiAgICBjb25zdCBpc0x0ciA9ICF0aGlzLl9kaXIgfHwgdGhpcy5fZGlyLnZhbHVlID09ICdsdHInO1xuXG4gICAgaWYgKHBvc2l0aW9uLm9yaWdpblkgPT09ICd0b3AnKSB7XG4gICAgICBwb3NpdGlvbi5vZmZzZXRZID0gLW9mZnNldDtcbiAgICB9IGVsc2UgaWYgKHBvc2l0aW9uLm9yaWdpblkgPT09ICdib3R0b20nKSB7XG4gICAgICBwb3NpdGlvbi5vZmZzZXRZID0gb2Zmc2V0O1xuICAgIH0gZWxzZSBpZiAocG9zaXRpb24ub3JpZ2luWCA9PT0gJ3N0YXJ0Jykge1xuICAgICAgcG9zaXRpb24ub2Zmc2V0WCA9IGlzTHRyID8gLW9mZnNldCA6IG9mZnNldDtcbiAgICB9IGVsc2UgaWYgKHBvc2l0aW9uLm9yaWdpblggPT09ICdlbmQnKSB7XG4gICAgICBwb3NpdGlvbi5vZmZzZXRYID0gaXNMdHIgPyBvZmZzZXQgOiAtb2Zmc2V0O1xuICAgIH1cblxuICAgIHJldHVybiBwb3NpdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBvcmlnaW4gcG9zaXRpb24gYW5kIGEgZmFsbGJhY2sgcG9zaXRpb24gYmFzZWQgb24gdGhlIHVzZXIncyBwb3NpdGlvbiBwcmVmZXJlbmNlLlxuICAgKiBUaGUgZmFsbGJhY2sgcG9zaXRpb24gaXMgdGhlIGludmVyc2Ugb2YgdGhlIG9yaWdpbiAoZS5nLiBgJ2JlbG93JyAtPiAnYWJvdmUnYCkuXG4gICAqL1xuICBfZ2V0T3JpZ2luKCk6IHttYWluOiBPcmlnaW5Db25uZWN0aW9uUG9zaXRpb247IGZhbGxiYWNrOiBPcmlnaW5Db25uZWN0aW9uUG9zaXRpb259IHtcbiAgICBjb25zdCBpc0x0ciA9ICF0aGlzLl9kaXIgfHwgdGhpcy5fZGlyLnZhbHVlID09ICdsdHInO1xuICAgIGNvbnN0IHBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbjtcbiAgICBsZXQgb3JpZ2luUG9zaXRpb246IE9yaWdpbkNvbm5lY3Rpb25Qb3NpdGlvbjtcblxuICAgIGlmIChwb3NpdGlvbiA9PSAnYWJvdmUnIHx8IHBvc2l0aW9uID09ICdiZWxvdycpIHtcbiAgICAgIG9yaWdpblBvc2l0aW9uID0ge29yaWdpblg6ICdjZW50ZXInLCBvcmlnaW5ZOiBwb3NpdGlvbiA9PSAnYWJvdmUnID8gJ3RvcCcgOiAnYm90dG9tJ307XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIHBvc2l0aW9uID09ICdiZWZvcmUnIHx8XG4gICAgICAocG9zaXRpb24gPT0gJ2xlZnQnICYmIGlzTHRyKSB8fFxuICAgICAgKHBvc2l0aW9uID09ICdyaWdodCcgJiYgIWlzTHRyKVxuICAgICkge1xuICAgICAgb3JpZ2luUG9zaXRpb24gPSB7b3JpZ2luWDogJ3N0YXJ0Jywgb3JpZ2luWTogJ2NlbnRlcid9O1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICBwb3NpdGlvbiA9PSAnYWZ0ZXInIHx8XG4gICAgICAocG9zaXRpb24gPT0gJ3JpZ2h0JyAmJiBpc0x0cikgfHxcbiAgICAgIChwb3NpdGlvbiA9PSAnbGVmdCcgJiYgIWlzTHRyKVxuICAgICkge1xuICAgICAgb3JpZ2luUG9zaXRpb24gPSB7b3JpZ2luWDogJ2VuZCcsIG9yaWdpblk6ICdjZW50ZXInfTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkge1xuICAgICAgdGhyb3cgZ2V0TWF0VG9vbHRpcEludmFsaWRQb3NpdGlvbkVycm9yKHBvc2l0aW9uKTtcbiAgICB9XG5cbiAgICBjb25zdCB7eCwgeX0gPSB0aGlzLl9pbnZlcnRQb3NpdGlvbihvcmlnaW5Qb3NpdGlvbiEub3JpZ2luWCwgb3JpZ2luUG9zaXRpb24hLm9yaWdpblkpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIG1haW46IG9yaWdpblBvc2l0aW9uISxcbiAgICAgIGZhbGxiYWNrOiB7b3JpZ2luWDogeCwgb3JpZ2luWTogeX0sXG4gICAgfTtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIHRoZSBvdmVybGF5IHBvc2l0aW9uIGFuZCBhIGZhbGxiYWNrIHBvc2l0aW9uIGJhc2VkIG9uIHRoZSB1c2VyJ3MgcHJlZmVyZW5jZSAqL1xuICBfZ2V0T3ZlcmxheVBvc2l0aW9uKCk6IHttYWluOiBPdmVybGF5Q29ubmVjdGlvblBvc2l0aW9uOyBmYWxsYmFjazogT3ZlcmxheUNvbm5lY3Rpb25Qb3NpdGlvbn0ge1xuICAgIGNvbnN0IGlzTHRyID0gIXRoaXMuX2RpciB8fCB0aGlzLl9kaXIudmFsdWUgPT0gJ2x0cic7XG4gICAgY29uc3QgcG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uO1xuICAgIGxldCBvdmVybGF5UG9zaXRpb246IE92ZXJsYXlDb25uZWN0aW9uUG9zaXRpb247XG5cbiAgICBpZiAocG9zaXRpb24gPT0gJ2Fib3ZlJykge1xuICAgICAgb3ZlcmxheVBvc2l0aW9uID0ge292ZXJsYXlYOiAnY2VudGVyJywgb3ZlcmxheVk6ICdib3R0b20nfTtcbiAgICB9IGVsc2UgaWYgKHBvc2l0aW9uID09ICdiZWxvdycpIHtcbiAgICAgIG92ZXJsYXlQb3NpdGlvbiA9IHtvdmVybGF5WDogJ2NlbnRlcicsIG92ZXJsYXlZOiAndG9wJ307XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIHBvc2l0aW9uID09ICdiZWZvcmUnIHx8XG4gICAgICAocG9zaXRpb24gPT0gJ2xlZnQnICYmIGlzTHRyKSB8fFxuICAgICAgKHBvc2l0aW9uID09ICdyaWdodCcgJiYgIWlzTHRyKVxuICAgICkge1xuICAgICAgb3ZlcmxheVBvc2l0aW9uID0ge292ZXJsYXlYOiAnZW5kJywgb3ZlcmxheVk6ICdjZW50ZXInfTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgcG9zaXRpb24gPT0gJ2FmdGVyJyB8fFxuICAgICAgKHBvc2l0aW9uID09ICdyaWdodCcgJiYgaXNMdHIpIHx8XG4gICAgICAocG9zaXRpb24gPT0gJ2xlZnQnICYmICFpc0x0cilcbiAgICApIHtcbiAgICAgIG92ZXJsYXlQb3NpdGlvbiA9IHtvdmVybGF5WDogJ3N0YXJ0Jywgb3ZlcmxheVk6ICdjZW50ZXInfTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkge1xuICAgICAgdGhyb3cgZ2V0TWF0VG9vbHRpcEludmFsaWRQb3NpdGlvbkVycm9yKHBvc2l0aW9uKTtcbiAgICB9XG5cbiAgICBjb25zdCB7eCwgeX0gPSB0aGlzLl9pbnZlcnRQb3NpdGlvbihvdmVybGF5UG9zaXRpb24hLm92ZXJsYXlYLCBvdmVybGF5UG9zaXRpb24hLm92ZXJsYXlZKTtcblxuICAgIHJldHVybiB7XG4gICAgICBtYWluOiBvdmVybGF5UG9zaXRpb24hLFxuICAgICAgZmFsbGJhY2s6IHtvdmVybGF5WDogeCwgb3ZlcmxheVk6IHl9LFxuICAgIH07XG4gIH1cblxuICAvKiogVXBkYXRlcyB0aGUgdG9vbHRpcCBtZXNzYWdlIGFuZCByZXBvc2l0aW9ucyB0aGUgb3ZlcmxheSBhY2NvcmRpbmcgdG8gdGhlIG5ldyBtZXNzYWdlIGxlbmd0aCAqL1xuICBwcml2YXRlIF91cGRhdGVUb29sdGlwTWVzc2FnZSgpIHtcbiAgICAvLyBNdXN0IHdhaXQgZm9yIHRoZSBtZXNzYWdlIHRvIGJlIHBhaW50ZWQgdG8gdGhlIHRvb2x0aXAgc28gdGhhdCB0aGUgb3ZlcmxheSBjYW4gcHJvcGVybHlcbiAgICAvLyBjYWxjdWxhdGUgdGhlIGNvcnJlY3QgcG9zaXRpb25pbmcgYmFzZWQgb24gdGhlIHNpemUgb2YgdGhlIHRleHQuXG4gICAgaWYgKHRoaXMuX3Rvb2x0aXBJbnN0YW5jZSkge1xuICAgICAgdGhpcy5fdG9vbHRpcEluc3RhbmNlLm1lc3NhZ2UgPSB0aGlzLm1lc3NhZ2U7XG4gICAgICB0aGlzLl90b29sdGlwSW5zdGFuY2UuX21hcmtGb3JDaGVjaygpO1xuXG4gICAgICBhZnRlck5leHRSZW5kZXIoXG4gICAgICAgICgpID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5fdG9vbHRpcEluc3RhbmNlKSB7XG4gICAgICAgICAgICB0aGlzLl9vdmVybGF5UmVmIS51cGRhdGVQb3NpdGlvbigpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGluamVjdG9yOiB0aGlzLl9pbmplY3RvcixcbiAgICAgICAgfSxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFVwZGF0ZXMgdGhlIHRvb2x0aXAgY2xhc3MgKi9cbiAgcHJpdmF0ZSBfc2V0VG9vbHRpcENsYXNzKHRvb2x0aXBDbGFzczogc3RyaW5nIHwgc3RyaW5nW10gfCBTZXQ8c3RyaW5nPiB8IHtba2V5OiBzdHJpbmddOiBhbnl9KSB7XG4gICAgaWYgKHRoaXMuX3Rvb2x0aXBJbnN0YW5jZSkge1xuICAgICAgdGhpcy5fdG9vbHRpcEluc3RhbmNlLnRvb2x0aXBDbGFzcyA9IHRvb2x0aXBDbGFzcztcbiAgICAgIHRoaXMuX3Rvb2x0aXBJbnN0YW5jZS5fbWFya0ZvckNoZWNrKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEludmVydHMgYW4gb3ZlcmxheSBwb3NpdGlvbi4gKi9cbiAgcHJpdmF0ZSBfaW52ZXJ0UG9zaXRpb24oeDogSG9yaXpvbnRhbENvbm5lY3Rpb25Qb3MsIHk6IFZlcnRpY2FsQ29ubmVjdGlvblBvcykge1xuICAgIGlmICh0aGlzLnBvc2l0aW9uID09PSAnYWJvdmUnIHx8IHRoaXMucG9zaXRpb24gPT09ICdiZWxvdycpIHtcbiAgICAgIGlmICh5ID09PSAndG9wJykge1xuICAgICAgICB5ID0gJ2JvdHRvbSc7XG4gICAgICB9IGVsc2UgaWYgKHkgPT09ICdib3R0b20nKSB7XG4gICAgICAgIHkgPSAndG9wJztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHggPT09ICdlbmQnKSB7XG4gICAgICAgIHggPSAnc3RhcnQnO1xuICAgICAgfSBlbHNlIGlmICh4ID09PSAnc3RhcnQnKSB7XG4gICAgICAgIHggPSAnZW5kJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge3gsIHl9O1xuICB9XG5cbiAgLyoqIFVwZGF0ZXMgdGhlIGNsYXNzIG9uIHRoZSBvdmVybGF5IHBhbmVsIGJhc2VkIG9uIHRoZSBjdXJyZW50IHBvc2l0aW9uIG9mIHRoZSB0b29sdGlwLiAqL1xuICBwcml2YXRlIF91cGRhdGVDdXJyZW50UG9zaXRpb25DbGFzcyhjb25uZWN0aW9uUGFpcjogQ29ubmVjdGlvblBvc2l0aW9uUGFpcik6IHZvaWQge1xuICAgIGNvbnN0IHtvdmVybGF5WSwgb3JpZ2luWCwgb3JpZ2luWX0gPSBjb25uZWN0aW9uUGFpcjtcbiAgICBsZXQgbmV3UG9zaXRpb246IFRvb2x0aXBQb3NpdGlvbjtcblxuICAgIC8vIElmIHRoZSBvdmVybGF5IGlzIGluIHRoZSBtaWRkbGUgYWxvbmcgdGhlIFkgYXhpcyxcbiAgICAvLyBpdCBtZWFucyB0aGF0IGl0J3MgZWl0aGVyIGJlZm9yZSBvciBhZnRlci5cbiAgICBpZiAob3ZlcmxheVkgPT09ICdjZW50ZXInKSB7XG4gICAgICAvLyBOb3RlIHRoYXQgc2luY2UgdGhpcyBpbmZvcm1hdGlvbiBpcyB1c2VkIGZvciBzdHlsaW5nLCB3ZSB3YW50IHRvXG4gICAgICAvLyByZXNvbHZlIGBzdGFydGAgYW5kIGBlbmRgIHRvIHRoZWlyIHJlYWwgdmFsdWVzLCBvdGhlcndpc2UgY29uc3VtZXJzXG4gICAgICAvLyB3b3VsZCBoYXZlIHRvIHJlbWVtYmVyIHRvIGRvIGl0IHRoZW1zZWx2ZXMgb24gZWFjaCBjb25zdW1wdGlvbi5cbiAgICAgIGlmICh0aGlzLl9kaXIgJiYgdGhpcy5fZGlyLnZhbHVlID09PSAncnRsJykge1xuICAgICAgICBuZXdQb3NpdGlvbiA9IG9yaWdpblggPT09ICdlbmQnID8gJ2xlZnQnIDogJ3JpZ2h0JztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5ld1Bvc2l0aW9uID0gb3JpZ2luWCA9PT0gJ3N0YXJ0JyA/ICdsZWZ0JyA6ICdyaWdodCc7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld1Bvc2l0aW9uID0gb3ZlcmxheVkgPT09ICdib3R0b20nICYmIG9yaWdpblkgPT09ICd0b3AnID8gJ2Fib3ZlJyA6ICdiZWxvdyc7XG4gICAgfVxuXG4gICAgaWYgKG5ld1Bvc2l0aW9uICE9PSB0aGlzLl9jdXJyZW50UG9zaXRpb24pIHtcbiAgICAgIGNvbnN0IG92ZXJsYXlSZWYgPSB0aGlzLl9vdmVybGF5UmVmO1xuXG4gICAgICBpZiAob3ZlcmxheVJlZikge1xuICAgICAgICBjb25zdCBjbGFzc1ByZWZpeCA9IGAke3RoaXMuX2Nzc0NsYXNzUHJlZml4fS0ke1BBTkVMX0NMQVNTfS1gO1xuICAgICAgICBvdmVybGF5UmVmLnJlbW92ZVBhbmVsQ2xhc3MoY2xhc3NQcmVmaXggKyB0aGlzLl9jdXJyZW50UG9zaXRpb24pO1xuICAgICAgICBvdmVybGF5UmVmLmFkZFBhbmVsQ2xhc3MoY2xhc3NQcmVmaXggKyBuZXdQb3NpdGlvbik7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX2N1cnJlbnRQb3NpdGlvbiA9IG5ld1Bvc2l0aW9uO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBCaW5kcyB0aGUgcG9pbnRlciBldmVudHMgdG8gdGhlIHRvb2x0aXAgdHJpZ2dlci4gKi9cbiAgcHJpdmF0ZSBfc2V0dXBQb2ludGVyRW50ZXJFdmVudHNJZk5lZWRlZCgpIHtcbiAgICAvLyBPcHRpbWl6YXRpb246IERlZmVyIGhvb2tpbmcgdXAgZXZlbnRzIGlmIHRoZXJlJ3Mgbm8gbWVzc2FnZSBvciB0aGUgdG9vbHRpcCBpcyBkaXNhYmxlZC5cbiAgICBpZiAoXG4gICAgICB0aGlzLl9kaXNhYmxlZCB8fFxuICAgICAgIXRoaXMubWVzc2FnZSB8fFxuICAgICAgIXRoaXMuX3ZpZXdJbml0aWFsaXplZCB8fFxuICAgICAgdGhpcy5fcGFzc2l2ZUxpc3RlbmVycy5sZW5ndGhcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBUaGUgbW91c2UgZXZlbnRzIHNob3VsZG4ndCBiZSBib3VuZCBvbiBtb2JpbGUgZGV2aWNlcywgYmVjYXVzZSB0aGV5IGNhbiBwcmV2ZW50IHRoZVxuICAgIC8vIGZpcnN0IHRhcCBmcm9tIGZpcmluZyBpdHMgY2xpY2sgZXZlbnQgb3IgY2FuIGNhdXNlIHRoZSB0b29sdGlwIHRvIG9wZW4gZm9yIGNsaWNrcy5cbiAgICBpZiAodGhpcy5fcGxhdGZvcm1TdXBwb3J0c01vdXNlRXZlbnRzKCkpIHtcbiAgICAgIHRoaXMuX3Bhc3NpdmVMaXN0ZW5lcnMucHVzaChbXG4gICAgICAgICdtb3VzZWVudGVyJyxcbiAgICAgICAgZXZlbnQgPT4ge1xuICAgICAgICAgIHRoaXMuX3NldHVwUG9pbnRlckV4aXRFdmVudHNJZk5lZWRlZCgpO1xuICAgICAgICAgIGxldCBwb2ludCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBpZiAoKGV2ZW50IGFzIE1vdXNlRXZlbnQpLnggIT09IHVuZGVmaW5lZCAmJiAoZXZlbnQgYXMgTW91c2VFdmVudCkueSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBwb2ludCA9IGV2ZW50IGFzIE1vdXNlRXZlbnQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuc2hvdyh1bmRlZmluZWQsIHBvaW50KTtcbiAgICAgICAgfSxcbiAgICAgIF0pO1xuICAgIH0gZWxzZSBpZiAodGhpcy50b3VjaEdlc3R1cmVzICE9PSAnb2ZmJykge1xuICAgICAgdGhpcy5fZGlzYWJsZU5hdGl2ZUdlc3R1cmVzSWZOZWNlc3NhcnkoKTtcblxuICAgICAgdGhpcy5fcGFzc2l2ZUxpc3RlbmVycy5wdXNoKFtcbiAgICAgICAgJ3RvdWNoc3RhcnQnLFxuICAgICAgICBldmVudCA9PiB7XG4gICAgICAgICAgY29uc3QgdG91Y2ggPSAoZXZlbnQgYXMgVG91Y2hFdmVudCkudGFyZ2V0VG91Y2hlcz8uWzBdO1xuICAgICAgICAgIGNvbnN0IG9yaWdpbiA9IHRvdWNoID8ge3g6IHRvdWNoLmNsaWVudFgsIHk6IHRvdWNoLmNsaWVudFl9IDogdW5kZWZpbmVkO1xuICAgICAgICAgIC8vIE5vdGUgdGhhdCBpdCdzIGltcG9ydGFudCB0aGF0IHdlIGRvbid0IGBwcmV2ZW50RGVmYXVsdGAgaGVyZSxcbiAgICAgICAgICAvLyBiZWNhdXNlIGl0IGNhbiBwcmV2ZW50IGNsaWNrIGV2ZW50cyBmcm9tIGZpcmluZyBvbiB0aGUgZWxlbWVudC5cbiAgICAgICAgICB0aGlzLl9zZXR1cFBvaW50ZXJFeGl0RXZlbnRzSWZOZWVkZWQoKTtcbiAgICAgICAgICBpZiAodGhpcy5fdG91Y2hzdGFydFRpbWVvdXQpIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl90b3VjaHN0YXJ0VGltZW91dCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgREVGQVVMVF9MT05HUFJFU1NfREVMQVkgPSA1MDA7XG4gICAgICAgICAgdGhpcy5fdG91Y2hzdGFydFRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3RvdWNoc3RhcnRUaW1lb3V0ID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuc2hvdyh1bmRlZmluZWQsIG9yaWdpbik7XG4gICAgICAgICAgfSwgdGhpcy5fZGVmYXVsdE9wdGlvbnMudG91Y2hMb25nUHJlc3NTaG93RGVsYXkgPz8gREVGQVVMVF9MT05HUFJFU1NfREVMQVkpO1xuICAgICAgICB9LFxuICAgICAgXSk7XG4gICAgfVxuXG4gICAgdGhpcy5fYWRkTGlzdGVuZXJzKHRoaXMuX3Bhc3NpdmVMaXN0ZW5lcnMpO1xuICB9XG5cbiAgcHJpdmF0ZSBfc2V0dXBQb2ludGVyRXhpdEV2ZW50c0lmTmVlZGVkKCkge1xuICAgIGlmICh0aGlzLl9wb2ludGVyRXhpdEV2ZW50c0luaXRpYWxpemVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuX3BvaW50ZXJFeGl0RXZlbnRzSW5pdGlhbGl6ZWQgPSB0cnVlO1xuXG4gICAgY29uc3QgZXhpdExpc3RlbmVyczogKHJlYWRvbmx5IFtzdHJpbmcsIEV2ZW50TGlzdGVuZXJPckV2ZW50TGlzdGVuZXJPYmplY3RdKVtdID0gW107XG4gICAgaWYgKHRoaXMuX3BsYXRmb3JtU3VwcG9ydHNNb3VzZUV2ZW50cygpKSB7XG4gICAgICBleGl0TGlzdGVuZXJzLnB1c2goXG4gICAgICAgIFtcbiAgICAgICAgICAnbW91c2VsZWF2ZScsXG4gICAgICAgICAgZXZlbnQgPT4ge1xuICAgICAgICAgICAgY29uc3QgbmV3VGFyZ2V0ID0gKGV2ZW50IGFzIE1vdXNlRXZlbnQpLnJlbGF0ZWRUYXJnZXQgYXMgTm9kZSB8IG51bGw7XG4gICAgICAgICAgICBpZiAoIW5ld1RhcmdldCB8fCAhdGhpcy5fb3ZlcmxheVJlZj8ub3ZlcmxheUVsZW1lbnQuY29udGFpbnMobmV3VGFyZ2V0KSkge1xuICAgICAgICAgICAgICB0aGlzLmhpZGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBbJ3doZWVsJywgZXZlbnQgPT4gdGhpcy5fd2hlZWxMaXN0ZW5lcihldmVudCBhcyBXaGVlbEV2ZW50KV0sXG4gICAgICApO1xuICAgIH0gZWxzZSBpZiAodGhpcy50b3VjaEdlc3R1cmVzICE9PSAnb2ZmJykge1xuICAgICAgdGhpcy5fZGlzYWJsZU5hdGl2ZUdlc3R1cmVzSWZOZWNlc3NhcnkoKTtcbiAgICAgIGNvbnN0IHRvdWNoZW5kTGlzdGVuZXIgPSAoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLl90b3VjaHN0YXJ0VGltZW91dCkge1xuICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl90b3VjaHN0YXJ0VGltZW91dCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5oaWRlKHRoaXMuX2RlZmF1bHRPcHRpb25zLnRvdWNoZW5kSGlkZURlbGF5KTtcbiAgICAgIH07XG5cbiAgICAgIGV4aXRMaXN0ZW5lcnMucHVzaChbJ3RvdWNoZW5kJywgdG91Y2hlbmRMaXN0ZW5lcl0sIFsndG91Y2hjYW5jZWwnLCB0b3VjaGVuZExpc3RlbmVyXSk7XG4gICAgfVxuXG4gICAgdGhpcy5fYWRkTGlzdGVuZXJzKGV4aXRMaXN0ZW5lcnMpO1xuICAgIHRoaXMuX3Bhc3NpdmVMaXN0ZW5lcnMucHVzaCguLi5leGl0TGlzdGVuZXJzKTtcbiAgfVxuXG4gIHByaXZhdGUgX2FkZExpc3RlbmVycyhsaXN0ZW5lcnM6IChyZWFkb25seSBbc3RyaW5nLCBFdmVudExpc3RlbmVyT3JFdmVudExpc3RlbmVyT2JqZWN0XSlbXSkge1xuICAgIGxpc3RlbmVycy5mb3JFYWNoKChbZXZlbnQsIGxpc3RlbmVyXSkgPT4ge1xuICAgICAgdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyLCBwYXNzaXZlTGlzdGVuZXJPcHRpb25zKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgX3BsYXRmb3JtU3VwcG9ydHNNb3VzZUV2ZW50cygpIHtcbiAgICByZXR1cm4gIXRoaXMuX3BsYXRmb3JtLklPUyAmJiAhdGhpcy5fcGxhdGZvcm0uQU5EUk9JRDtcbiAgfVxuXG4gIC8qKiBMaXN0ZW5lciBmb3IgdGhlIGB3aGVlbGAgZXZlbnQgb24gdGhlIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX3doZWVsTGlzdGVuZXIoZXZlbnQ6IFdoZWVsRXZlbnQpIHtcbiAgICBpZiAodGhpcy5faXNUb29sdGlwVmlzaWJsZSgpKSB7XG4gICAgICBjb25zdCBlbGVtZW50VW5kZXJQb2ludGVyID0gdGhpcy5fZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChldmVudC5jbGllbnRYLCBldmVudC5jbGllbnRZKTtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG5cbiAgICAgIC8vIE9uIG5vbi10b3VjaCBkZXZpY2VzIHdlIGRlcGVuZCBvbiB0aGUgYG1vdXNlbGVhdmVgIGV2ZW50IHRvIGNsb3NlIHRoZSB0b29sdGlwLCBidXQgaXRcbiAgICAgIC8vIHdvbid0IGZpcmUgaWYgdGhlIHVzZXIgc2Nyb2xscyBhd2F5IHVzaW5nIHRoZSB3aGVlbCB3aXRob3V0IG1vdmluZyB0aGVpciBjdXJzb3IuIFdlXG4gICAgICAvLyB3b3JrIGFyb3VuZCBpdCBieSBmaW5kaW5nIHRoZSBlbGVtZW50IHVuZGVyIHRoZSB1c2VyJ3MgY3Vyc29yIGFuZCBjbG9zaW5nIHRoZSB0b29sdGlwXG4gICAgICAvLyBpZiBpdCdzIG5vdCB0aGUgdHJpZ2dlci5cbiAgICAgIGlmIChlbGVtZW50VW5kZXJQb2ludGVyICE9PSBlbGVtZW50ICYmICFlbGVtZW50LmNvbnRhaW5zKGVsZW1lbnRVbmRlclBvaW50ZXIpKSB7XG4gICAgICAgIHRoaXMuaGlkZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBEaXNhYmxlcyB0aGUgbmF0aXZlIGJyb3dzZXIgZ2VzdHVyZXMsIGJhc2VkIG9uIGhvdyB0aGUgdG9vbHRpcCBoYXMgYmVlbiBjb25maWd1cmVkLiAqL1xuICBwcml2YXRlIF9kaXNhYmxlTmF0aXZlR2VzdHVyZXNJZk5lY2Vzc2FyeSgpIHtcbiAgICBjb25zdCBnZXN0dXJlcyA9IHRoaXMudG91Y2hHZXN0dXJlcztcblxuICAgIGlmIChnZXN0dXJlcyAhPT0gJ29mZicpIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG4gICAgICBjb25zdCBzdHlsZSA9IGVsZW1lbnQuc3R5bGU7XG5cbiAgICAgIC8vIElmIGdlc3R1cmVzIGFyZSBzZXQgdG8gYGF1dG9gLCB3ZSBkb24ndCBkaXNhYmxlIHRleHQgc2VsZWN0aW9uIG9uIGlucHV0cyBhbmRcbiAgICAgIC8vIHRleHRhcmVhcywgYmVjYXVzZSBpdCBwcmV2ZW50cyB0aGUgdXNlciBmcm9tIHR5cGluZyBpbnRvIHRoZW0gb24gaU9TIFNhZmFyaS5cbiAgICAgIGlmIChnZXN0dXJlcyA9PT0gJ29uJyB8fCAoZWxlbWVudC5ub2RlTmFtZSAhPT0gJ0lOUFVUJyAmJiBlbGVtZW50Lm5vZGVOYW1lICE9PSAnVEVYVEFSRUEnKSkge1xuICAgICAgICBzdHlsZS51c2VyU2VsZWN0ID1cbiAgICAgICAgICAoc3R5bGUgYXMgYW55KS5tc1VzZXJTZWxlY3QgPVxuICAgICAgICAgIHN0eWxlLndlYmtpdFVzZXJTZWxlY3QgPVxuICAgICAgICAgIChzdHlsZSBhcyBhbnkpLk1velVzZXJTZWxlY3QgPVxuICAgICAgICAgICAgJ25vbmUnO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiB3ZSBoYXZlIGBhdXRvYCBnZXN0dXJlcyBhbmQgdGhlIGVsZW1lbnQgdXNlcyBuYXRpdmUgSFRNTCBkcmFnZ2luZyxcbiAgICAgIC8vIHdlIGRvbid0IHNldCBgLXdlYmtpdC11c2VyLWRyYWdgIGJlY2F1c2UgaXQgcHJldmVudHMgdGhlIG5hdGl2ZSBiZWhhdmlvci5cbiAgICAgIGlmIChnZXN0dXJlcyA9PT0gJ29uJyB8fCAhZWxlbWVudC5kcmFnZ2FibGUpIHtcbiAgICAgICAgKHN0eWxlIGFzIGFueSkud2Via2l0VXNlckRyYWcgPSAnbm9uZSc7XG4gICAgICB9XG5cbiAgICAgIHN0eWxlLnRvdWNoQWN0aW9uID0gJ25vbmUnO1xuICAgICAgKHN0eWxlIGFzIGFueSkud2Via2l0VGFwSGlnaGxpZ2h0Q29sb3IgPSAndHJhbnNwYXJlbnQnO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBVcGRhdGVzIHRoZSB0b29sdGlwJ3MgQVJJQSBkZXNjcmlwdGlvbiBiYXNlZCBvbiBpdCBjdXJyZW50IHN0YXRlLiAqL1xuICBwcml2YXRlIF9zeW5jQXJpYURlc2NyaXB0aW9uKG9sZE1lc3NhZ2U6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9hcmlhRGVzY3JpcHRpb25QZW5kaW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fYXJpYURlc2NyaXB0aW9uUGVuZGluZyA9IHRydWU7XG4gICAgdGhpcy5fYXJpYURlc2NyaWJlci5yZW1vdmVEZXNjcmlwdGlvbih0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsIG9sZE1lc3NhZ2UsICd0b29sdGlwJyk7XG5cbiAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgLy8gVGhlIGBBcmlhRGVzY3JpYmVyYCBoYXMgc29tZSBmdW5jdGlvbmFsaXR5IHRoYXQgYXZvaWRzIGFkZGluZyBhIGRlc2NyaXB0aW9uIGlmIGl0J3MgdGhlXG4gICAgICAvLyBzYW1lIGFzIHRoZSBgYXJpYS1sYWJlbGAgb2YgYW4gZWxlbWVudCwgaG93ZXZlciB3ZSBjYW4ndCBrbm93IHdoZXRoZXIgdGhlIHRvb2x0aXAgdHJpZ2dlclxuICAgICAgLy8gaGFzIGEgZGF0YS1ib3VuZCBgYXJpYS1sYWJlbGAgb3Igd2hlbiBpdCdsbCBiZSBzZXQgZm9yIHRoZSBmaXJzdCB0aW1lLiBXZSBjYW4gYXZvaWQgdGhlXG4gICAgICAvLyBpc3N1ZSBieSBkZWZlcnJpbmcgdGhlIGRlc2NyaXB0aW9uIGJ5IGEgdGljayBzbyBBbmd1bGFyIGhhcyB0aW1lIHRvIHNldCB0aGUgYGFyaWEtbGFiZWxgLlxuICAgICAgUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICAgIHRoaXMuX2FyaWFEZXNjcmlwdGlvblBlbmRpbmcgPSBmYWxzZTtcblxuICAgICAgICBpZiAodGhpcy5tZXNzYWdlICYmICF0aGlzLmRpc2FibGVkKSB7XG4gICAgICAgICAgdGhpcy5fYXJpYURlc2NyaWJlci5kZXNjcmliZSh0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsIHRoaXMubWVzc2FnZSwgJ3Rvb2x0aXAnKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnRlcm5hbCBjb21wb25lbnQgdGhhdCB3cmFwcyB0aGUgdG9vbHRpcCdzIGNvbnRlbnQuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ21hdC10b29sdGlwLWNvbXBvbmVudCcsXG4gIHRlbXBsYXRlVXJsOiAndG9vbHRpcC5odG1sJyxcbiAgc3R5bGVVcmw6ICd0b29sdGlwLmNzcycsXG4gIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLk5vbmUsXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoLFxuICBob3N0OiB7XG4gICAgJyhtb3VzZWxlYXZlKSc6ICdfaGFuZGxlTW91c2VMZWF2ZSgkZXZlbnQpJyxcbiAgICAnYXJpYS1oaWRkZW4nOiAndHJ1ZScsXG4gIH0sXG4gIHN0YW5kYWxvbmU6IHRydWUsXG4gIGltcG9ydHM6IFtOZ0NsYXNzXSxcbn0pXG5leHBvcnQgY2xhc3MgVG9vbHRpcENvbXBvbmVudCBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIC8qIFdoZXRoZXIgdGhlIHRvb2x0aXAgdGV4dCBvdmVyZmxvd3MgdG8gbXVsdGlwbGUgbGluZXMgKi9cbiAgX2lzTXVsdGlsaW5lID0gZmFsc2U7XG5cbiAgLyoqIE1lc3NhZ2UgdG8gZGlzcGxheSBpbiB0aGUgdG9vbHRpcCAqL1xuICBtZXNzYWdlOiBzdHJpbmc7XG5cbiAgLyoqIENsYXNzZXMgdG8gYmUgYWRkZWQgdG8gdGhlIHRvb2x0aXAuIFN1cHBvcnRzIHRoZSBzYW1lIHN5bnRheCBhcyBgbmdDbGFzc2AuICovXG4gIHRvb2x0aXBDbGFzczogc3RyaW5nIHwgc3RyaW5nW10gfCBTZXQ8c3RyaW5nPiB8IHtba2V5OiBzdHJpbmddOiBhbnl9O1xuXG4gIC8qKiBUaGUgdGltZW91dCBJRCBvZiBhbnkgY3VycmVudCB0aW1lciBzZXQgdG8gc2hvdyB0aGUgdG9vbHRpcCAqL1xuICBwcml2YXRlIF9zaG93VGltZW91dElkOiBSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0PiB8IHVuZGVmaW5lZDtcblxuICAvKiogVGhlIHRpbWVvdXQgSUQgb2YgYW55IGN1cnJlbnQgdGltZXIgc2V0IHRvIGhpZGUgdGhlIHRvb2x0aXAgKi9cbiAgcHJpdmF0ZSBfaGlkZVRpbWVvdXRJZDogUmV0dXJuVHlwZTx0eXBlb2Ygc2V0VGltZW91dD4gfCB1bmRlZmluZWQ7XG5cbiAgLyoqIEVsZW1lbnQgdGhhdCBjYXVzZWQgdGhlIHRvb2x0aXAgdG8gb3Blbi4gKi9cbiAgX3RyaWdnZXJFbGVtZW50OiBIVE1MRWxlbWVudDtcblxuICAvKiogQW1vdW50IG9mIG1pbGxpc2Vjb25kcyB0byBkZWxheSB0aGUgY2xvc2luZyBzZXF1ZW5jZS4gKi9cbiAgX21vdXNlTGVhdmVIaWRlRGVsYXk6IG51bWJlcjtcblxuICAvKiogV2hldGhlciBhbmltYXRpb25zIGFyZSBjdXJyZW50bHkgZGlzYWJsZWQuICovXG4gIHByaXZhdGUgX2FuaW1hdGlvbnNEaXNhYmxlZDogYm9vbGVhbjtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSBpbnRlcm5hbCB0b29sdGlwIGVsZW1lbnQuICovXG4gIEBWaWV3Q2hpbGQoJ3Rvb2x0aXAnLCB7XG4gICAgLy8gVXNlIGEgc3RhdGljIHF1ZXJ5IGhlcmUgc2luY2Ugd2UgaW50ZXJhY3QgZGlyZWN0bHkgd2l0aFxuICAgIC8vIHRoZSBET00gd2hpY2ggY2FuIGhhcHBlbiBiZWZvcmUgYG5nQWZ0ZXJWaWV3SW5pdGAuXG4gICAgc3RhdGljOiB0cnVlLFxuICB9KVxuICBfdG9vbHRpcDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD47XG5cbiAgLyoqIFdoZXRoZXIgaW50ZXJhY3Rpb25zIG9uIHRoZSBwYWdlIHNob3VsZCBjbG9zZSB0aGUgdG9vbHRpcCAqL1xuICBwcml2YXRlIF9jbG9zZU9uSW50ZXJhY3Rpb24gPSBmYWxzZTtcblxuICAvKiogV2hldGhlciB0aGUgdG9vbHRpcCBpcyBjdXJyZW50bHkgdmlzaWJsZS4gKi9cbiAgcHJpdmF0ZSBfaXNWaXNpYmxlID0gZmFsc2U7XG5cbiAgLyoqIFN1YmplY3QgZm9yIG5vdGlmeWluZyB0aGF0IHRoZSB0b29sdGlwIGhhcyBiZWVuIGhpZGRlbiBmcm9tIHRoZSB2aWV3ICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX29uSGlkZTogU3ViamVjdDx2b2lkPiA9IG5ldyBTdWJqZWN0KCk7XG5cbiAgLyoqIE5hbWUgb2YgdGhlIHNob3cgYW5pbWF0aW9uIGFuZCB0aGUgY2xhc3MgdGhhdCB0b2dnbGVzIGl0LiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9zaG93QW5pbWF0aW9uID0gJ21hdC1tZGMtdG9vbHRpcC1zaG93JztcblxuICAvKiogTmFtZSBvZiB0aGUgaGlkZSBhbmltYXRpb24gYW5kIHRoZSBjbGFzcyB0aGF0IHRvZ2dsZXMgaXQuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX2hpZGVBbmltYXRpb24gPSAnbWF0LW1kYy10b29sdGlwLWhpZGUnO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgX2NoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICBwcm90ZWN0ZWQgX2VsZW1lbnRSZWY6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgIEBPcHRpb25hbCgpIEBJbmplY3QoQU5JTUFUSU9OX01PRFVMRV9UWVBFKSBhbmltYXRpb25Nb2RlPzogc3RyaW5nLFxuICApIHtcbiAgICB0aGlzLl9hbmltYXRpb25zRGlzYWJsZWQgPSBhbmltYXRpb25Nb2RlID09PSAnTm9vcEFuaW1hdGlvbnMnO1xuICB9XG5cbiAgLyoqXG4gICAqIFNob3dzIHRoZSB0b29sdGlwIHdpdGggYW4gYW5pbWF0aW9uIG9yaWdpbmF0aW5nIGZyb20gdGhlIHByb3ZpZGVkIG9yaWdpblxuICAgKiBAcGFyYW0gZGVsYXkgQW1vdW50IG9mIG1pbGxpc2Vjb25kcyB0byB0aGUgZGVsYXkgc2hvd2luZyB0aGUgdG9vbHRpcC5cbiAgICovXG4gIHNob3coZGVsYXk6IG51bWJlcik6IHZvaWQge1xuICAgIC8vIENhbmNlbCB0aGUgZGVsYXllZCBoaWRlIGlmIGl0IGlzIHNjaGVkdWxlZFxuICAgIGlmICh0aGlzLl9oaWRlVGltZW91dElkICE9IG51bGwpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9oaWRlVGltZW91dElkKTtcbiAgICB9XG5cbiAgICB0aGlzLl9zaG93VGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLl90b2dnbGVWaXNpYmlsaXR5KHRydWUpO1xuICAgICAgdGhpcy5fc2hvd1RpbWVvdXRJZCA9IHVuZGVmaW5lZDtcbiAgICB9LCBkZWxheSk7XG4gIH1cblxuICAvKipcbiAgICogQmVnaW5zIHRoZSBhbmltYXRpb24gdG8gaGlkZSB0aGUgdG9vbHRpcCBhZnRlciB0aGUgcHJvdmlkZWQgZGVsYXkgaW4gbXMuXG4gICAqIEBwYXJhbSBkZWxheSBBbW91bnQgb2YgbWlsbGlzZWNvbmRzIHRvIGRlbGF5IHNob3dpbmcgdGhlIHRvb2x0aXAuXG4gICAqL1xuICBoaWRlKGRlbGF5OiBudW1iZXIpOiB2b2lkIHtcbiAgICAvLyBDYW5jZWwgdGhlIGRlbGF5ZWQgc2hvdyBpZiBpdCBpcyBzY2hlZHVsZWRcbiAgICBpZiAodGhpcy5fc2hvd1RpbWVvdXRJZCAhPSBudWxsKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fc2hvd1RpbWVvdXRJZCk7XG4gICAgfVxuXG4gICAgdGhpcy5faGlkZVRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5fdG9nZ2xlVmlzaWJpbGl0eShmYWxzZSk7XG4gICAgICB0aGlzLl9oaWRlVGltZW91dElkID0gdW5kZWZpbmVkO1xuICAgIH0sIGRlbGF5KTtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIGFuIG9ic2VydmFibGUgdGhhdCBub3RpZmllcyB3aGVuIHRoZSB0b29sdGlwIGhhcyBiZWVuIGhpZGRlbiBmcm9tIHZpZXcuICovXG4gIGFmdGVySGlkZGVuKCk6IE9ic2VydmFibGU8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLl9vbkhpZGU7XG4gIH1cblxuICAvKiogV2hldGhlciB0aGUgdG9vbHRpcCBpcyBiZWluZyBkaXNwbGF5ZWQuICovXG4gIGlzVmlzaWJsZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5faXNWaXNpYmxlO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fY2FuY2VsUGVuZGluZ0FuaW1hdGlvbnMoKTtcbiAgICB0aGlzLl9vbkhpZGUuY29tcGxldGUoKTtcbiAgICB0aGlzLl90cmlnZ2VyRWxlbWVudCA9IG51bGwhO1xuICB9XG5cbiAgLyoqXG4gICAqIEludGVyYWN0aW9ucyBvbiB0aGUgSFRNTCBib2R5IHNob3VsZCBjbG9zZSB0aGUgdG9vbHRpcCBpbW1lZGlhdGVseSBhcyBkZWZpbmVkIGluIHRoZVxuICAgKiBtYXRlcmlhbCBkZXNpZ24gc3BlYy5cbiAgICogaHR0cHM6Ly9tYXRlcmlhbC5pby9kZXNpZ24vY29tcG9uZW50cy90b29sdGlwcy5odG1sI2JlaGF2aW9yXG4gICAqL1xuICBfaGFuZGxlQm9keUludGVyYWN0aW9uKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9jbG9zZU9uSW50ZXJhY3Rpb24pIHtcbiAgICAgIHRoaXMuaGlkZSgwKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTWFya3MgdGhhdCB0aGUgdG9vbHRpcCBuZWVkcyB0byBiZSBjaGVja2VkIGluIHRoZSBuZXh0IGNoYW5nZSBkZXRlY3Rpb24gcnVuLlxuICAgKiBNYWlubHkgdXNlZCBmb3IgcmVuZGVyaW5nIHRoZSBpbml0aWFsIHRleHQgYmVmb3JlIHBvc2l0aW9uaW5nIGEgdG9vbHRpcCwgd2hpY2hcbiAgICogY2FuIGJlIHByb2JsZW1hdGljIGluIGNvbXBvbmVudHMgd2l0aCBPblB1c2ggY2hhbmdlIGRldGVjdGlvbi5cbiAgICovXG4gIF9tYXJrRm9yQ2hlY2soKTogdm9pZCB7XG4gICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gIH1cblxuICBfaGFuZGxlTW91c2VMZWF2ZSh7cmVsYXRlZFRhcmdldH06IE1vdXNlRXZlbnQpIHtcbiAgICBpZiAoIXJlbGF0ZWRUYXJnZXQgfHwgIXRoaXMuX3RyaWdnZXJFbGVtZW50LmNvbnRhaW5zKHJlbGF0ZWRUYXJnZXQgYXMgTm9kZSkpIHtcbiAgICAgIGlmICh0aGlzLmlzVmlzaWJsZSgpKSB7XG4gICAgICAgIHRoaXMuaGlkZSh0aGlzLl9tb3VzZUxlYXZlSGlkZURlbGF5KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2ZpbmFsaXplQW5pbWF0aW9uKGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGJhY2sgZm9yIHdoZW4gdGhlIHRpbWVvdXQgaW4gdGhpcy5zaG93KCkgZ2V0cyBjb21wbGV0ZWQuXG4gICAqIFRoaXMgbWV0aG9kIGlzIG9ubHkgbmVlZGVkIGJ5IHRoZSBtZGMtdG9vbHRpcCwgYW5kIHNvIGl0IGlzIG9ubHkgaW1wbGVtZW50ZWRcbiAgICogaW4gdGhlIG1kYy10b29sdGlwLCBub3QgaGVyZS5cbiAgICovXG4gIHByb3RlY3RlZCBfb25TaG93KCk6IHZvaWQge1xuICAgIHRoaXMuX2lzTXVsdGlsaW5lID0gdGhpcy5faXNUb29sdGlwTXVsdGlsaW5lKCk7XG4gICAgdGhpcy5fbWFya0ZvckNoZWNrKCk7XG4gIH1cblxuICAvKiogV2hldGhlciB0aGUgdG9vbHRpcCB0ZXh0IGhhcyBvdmVyZmxvd24gdG8gdGhlIG5leHQgbGluZSAqL1xuICBwcml2YXRlIF9pc1Rvb2x0aXBNdWx0aWxpbmUoKSB7XG4gICAgY29uc3QgcmVjdCA9IHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICByZXR1cm4gcmVjdC5oZWlnaHQgPiBNSU5fSEVJR0hUICYmIHJlY3Qud2lkdGggPj0gTUFYX1dJRFRIO1xuICB9XG5cbiAgLyoqIEV2ZW50IGxpc3RlbmVyIGRpc3BhdGNoZWQgd2hlbiBhbiBhbmltYXRpb24gb24gdGhlIHRvb2x0aXAgZmluaXNoZXMuICovXG4gIF9oYW5kbGVBbmltYXRpb25FbmQoe2FuaW1hdGlvbk5hbWV9OiBBbmltYXRpb25FdmVudCkge1xuICAgIGlmIChhbmltYXRpb25OYW1lID09PSB0aGlzLl9zaG93QW5pbWF0aW9uIHx8IGFuaW1hdGlvbk5hbWUgPT09IHRoaXMuX2hpZGVBbmltYXRpb24pIHtcbiAgICAgIHRoaXMuX2ZpbmFsaXplQW5pbWF0aW9uKGFuaW1hdGlvbk5hbWUgPT09IHRoaXMuX3Nob3dBbmltYXRpb24pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDYW5jZWxzIGFueSBwZW5kaW5nIGFuaW1hdGlvbiBzZXF1ZW5jZXMuICovXG4gIF9jYW5jZWxQZW5kaW5nQW5pbWF0aW9ucygpIHtcbiAgICBpZiAodGhpcy5fc2hvd1RpbWVvdXRJZCAhPSBudWxsKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fc2hvd1RpbWVvdXRJZCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2hpZGVUaW1lb3V0SWQgIT0gbnVsbCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX2hpZGVUaW1lb3V0SWQpO1xuICAgIH1cblxuICAgIHRoaXMuX3Nob3dUaW1lb3V0SWQgPSB0aGlzLl9oaWRlVGltZW91dElkID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqIEhhbmRsZXMgdGhlIGNsZWFudXAgYWZ0ZXIgYW4gYW5pbWF0aW9uIGhhcyBmaW5pc2hlZC4gKi9cbiAgcHJpdmF0ZSBfZmluYWxpemVBbmltYXRpb24odG9WaXNpYmxlOiBib29sZWFuKSB7XG4gICAgaWYgKHRvVmlzaWJsZSkge1xuICAgICAgdGhpcy5fY2xvc2VPbkludGVyYWN0aW9uID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKCF0aGlzLmlzVmlzaWJsZSgpKSB7XG4gICAgICB0aGlzLl9vbkhpZGUubmV4dCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBUb2dnbGVzIHRoZSB2aXNpYmlsaXR5IG9mIHRoZSB0b29sdGlwIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX3RvZ2dsZVZpc2liaWxpdHkoaXNWaXNpYmxlOiBib29sZWFuKSB7XG4gICAgLy8gV2Ugc2V0IHRoZSBjbGFzc2VzIGRpcmVjdGx5IGhlcmUgb3Vyc2VsdmVzIHNvIHRoYXQgdG9nZ2xpbmcgdGhlIHRvb2x0aXAgc3RhdGVcbiAgICAvLyBpc24ndCBib3VuZCBieSBjaGFuZ2UgZGV0ZWN0aW9uLiBUaGlzIGFsbG93cyB1cyB0byBoaWRlIGl0IGV2ZW4gaWYgdGhlXG4gICAgLy8gdmlldyByZWYgaGFzIGJlZW4gZGV0YWNoZWQgZnJvbSB0aGUgQ0QgdHJlZS5cbiAgICBjb25zdCB0b29sdGlwID0gdGhpcy5fdG9vbHRpcC5uYXRpdmVFbGVtZW50O1xuICAgIGNvbnN0IHNob3dDbGFzcyA9IHRoaXMuX3Nob3dBbmltYXRpb247XG4gICAgY29uc3QgaGlkZUNsYXNzID0gdGhpcy5faGlkZUFuaW1hdGlvbjtcbiAgICB0b29sdGlwLmNsYXNzTGlzdC5yZW1vdmUoaXNWaXNpYmxlID8gaGlkZUNsYXNzIDogc2hvd0NsYXNzKTtcbiAgICB0b29sdGlwLmNsYXNzTGlzdC5hZGQoaXNWaXNpYmxlID8gc2hvd0NsYXNzIDogaGlkZUNsYXNzKTtcbiAgICBpZiAodGhpcy5faXNWaXNpYmxlICE9PSBpc1Zpc2libGUpIHtcbiAgICAgIHRoaXMuX2lzVmlzaWJsZSA9IGlzVmlzaWJsZTtcbiAgICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICAgIH1cblxuICAgIC8vIEl0J3MgY29tbW9uIGZvciBpbnRlcm5hbCBhcHBzIHRvIGRpc2FibGUgYW5pbWF0aW9ucyB1c2luZyBgKiB7IGFuaW1hdGlvbjogbm9uZSAhaW1wb3J0YW50IH1gXG4gICAgLy8gd2hpY2ggY2FuIGJyZWFrIHRoZSBvcGVuaW5nIHNlcXVlbmNlLiBUcnkgdG8gZGV0ZWN0IHN1Y2ggY2FzZXMgYW5kIHdvcmsgYXJvdW5kIHRoZW0uXG4gICAgaWYgKGlzVmlzaWJsZSAmJiAhdGhpcy5fYW5pbWF0aW9uc0Rpc2FibGVkICYmIHR5cGVvZiBnZXRDb21wdXRlZFN0eWxlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjb25zdCBzdHlsZXMgPSBnZXRDb21wdXRlZFN0eWxlKHRvb2x0aXApO1xuXG4gICAgICAvLyBVc2UgYGdldFByb3BlcnR5VmFsdWVgIHRvIGF2b2lkIGlzc3VlcyB3aXRoIHByb3BlcnR5IHJlbmFtaW5nLlxuICAgICAgaWYgKFxuICAgICAgICBzdHlsZXMuZ2V0UHJvcGVydHlWYWx1ZSgnYW5pbWF0aW9uLWR1cmF0aW9uJykgPT09ICcwcycgfHxcbiAgICAgICAgc3R5bGVzLmdldFByb3BlcnR5VmFsdWUoJ2FuaW1hdGlvbi1uYW1lJykgPT09ICdub25lJ1xuICAgICAgKSB7XG4gICAgICAgIHRoaXMuX2FuaW1hdGlvbnNEaXNhYmxlZCA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGlzVmlzaWJsZSkge1xuICAgICAgdGhpcy5fb25TaG93KCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2FuaW1hdGlvbnNEaXNhYmxlZCkge1xuICAgICAgdG9vbHRpcC5jbGFzc0xpc3QuYWRkKCdfbWF0LWFuaW1hdGlvbi1ub29wYWJsZScpO1xuICAgICAgdGhpcy5fZmluYWxpemVBbmltYXRpb24oaXNWaXNpYmxlKTtcbiAgICB9XG4gIH1cbn1cbiIsIjxkaXZcbiAgI3Rvb2x0aXBcbiAgY2xhc3M9XCJtZGMtdG9vbHRpcCBtYXQtbWRjLXRvb2x0aXBcIlxuICBbbmdDbGFzc109XCJ0b29sdGlwQ2xhc3NcIlxuICAoYW5pbWF0aW9uZW5kKT1cIl9oYW5kbGVBbmltYXRpb25FbmQoJGV2ZW50KVwiXG4gIFtjbGFzcy5tZGMtdG9vbHRpcC0tbXVsdGlsaW5lXT1cIl9pc011bHRpbGluZVwiPlxuICA8ZGl2IGNsYXNzPVwibWF0LW1kYy10b29sdGlwLXN1cmZhY2UgbWRjLXRvb2x0aXBfX3N1cmZhY2VcIj57e21lc3NhZ2V9fTwvZGl2PlxuPC9kaXY+XG4iXX0=