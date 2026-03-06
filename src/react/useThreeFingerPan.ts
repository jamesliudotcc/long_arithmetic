import { useEffect } from "react";

// Set of currently-active pointer IDs.  Updated in the capture phase so the
// count is always current before React's bubble-phase handlers run.
const _active = new Set<number>();

// True while a 3-finger pan gesture is in progress.
let _panning = false;

/** Number of active pointer contacts across the whole page. */
export function getPointerCount(): number {
	return _active.size;
}

/** True while a 3-finger touch pan is in progress. */
export function isPanning(): boolean {
	return _panning;
}

// Walk up the DOM from (x, y) and return the nearest scrollable ancestor.
// React Native's ScrollView renders as a div with overflow:scroll/auto, so
// this finds it rather than falling back to the (non-scrollable) window.
function findScrollable(x: number, y: number): Element {
	let el: Element | null = document.elementFromPoint(x, y);
	while (el && el !== document.documentElement) {
		const { overflow, overflowX, overflowY } = window.getComputedStyle(el);
		if (/auto|scroll/.test(overflow + overflowY + overflowX)) {
			return el;
		}
		el = el.parentElement;
	}
	return document.scrollingElement ?? document.documentElement;
}

/**
 * Mount once at the web app root.
 *
 * Two responsibilities:
 *  1. Pointer ID tracking — keeps `getPointerCount()` / `isPanning()` current
 *     so carry-zone handlers can yield to a pan gesture.
 *  2. 3-finger pan — uses touch events (which give all contacts at once).
 *     `preventDefault()` in touchstart stops the browser from initiating a
 *     native scroll, which would fire `pointercancel` on the other fingers
 *     and break both the drag-detection count and the pan delta tracking.
 *     The scroll target is the nearest scrollable ancestor at the centroid,
 *     not `window` (which is not scrollable in the Expo web layout).
 */
export function useThreeFingerPan(): void {
	useEffect(() => {
		if (typeof window === "undefined") return;

		// ── Pointer ID tracking ──────────────────────────────────────────────
		function onPointerDown(e: PointerEvent) {
			_active.add(e.pointerId);
		}
		function onPointerUp(e: PointerEvent) {
			_active.delete(e.pointerId);
		}
		window.addEventListener("pointerdown", onPointerDown, { capture: true });
		window.addEventListener("pointerup", onPointerUp, { capture: true });
		window.addEventListener("pointercancel", onPointerUp, { capture: true });

		// ── 3-finger pan (touch events) ──────────────────────────────────────
		let lastC: { x: number; y: number } | null = null;
		let scrollEl: Element | null = null;

		function avg(tl: TouchList) {
			let x = 0;
			let y = 0;
			for (let i = 0; i < tl.length; i++) {
				x += tl[i].clientX;
				y += tl[i].clientY;
			}
			return { x: x / tl.length, y: y / tl.length };
		}

		function onTouchStart(e: TouchEvent) {
			if (e.touches.length >= 3) {
				e.preventDefault(); // stop browser scroll → prevents pointercancel
				_panning = true;
				const c = avg(e.touches);
				lastC = c;
				scrollEl = findScrollable(c.x, c.y);
			}
		}

		function onTouchMove(e: TouchEvent) {
			if (e.touches.length >= 3 && lastC && scrollEl) {
				e.preventDefault();
				const c = avg(e.touches);
				scrollEl.scrollBy(lastC.x - c.x, lastC.y - c.y);
				lastC = c;
			}
		}

		function onTouchEnd(e: TouchEvent) {
			if (e.touches.length < 3) {
				_panning = false;
				lastC = null;
				scrollEl = null;
			}
		}

		document.addEventListener("touchstart", onTouchStart, {
			passive: false,
			capture: true,
		});
		document.addEventListener("touchmove", onTouchMove, {
			passive: false,
			capture: true,
		});
		document.addEventListener("touchend", onTouchEnd, { capture: true });
		document.addEventListener("touchcancel", onTouchEnd, { capture: true });

		return () => {
			window.removeEventListener("pointerdown", onPointerDown, {
				capture: true,
			});
			window.removeEventListener("pointerup", onPointerUp, { capture: true });
			window.removeEventListener("pointercancel", onPointerUp, {
				capture: true,
			});
			document.removeEventListener("touchstart", onTouchStart, {
				capture: true,
			});
			document.removeEventListener("touchmove", onTouchMove, {
				capture: true,
			});
			document.removeEventListener("touchend", onTouchEnd, { capture: true });
			document.removeEventListener("touchcancel", onTouchEnd, {
				capture: true,
			});
		};
	}, []);
}
