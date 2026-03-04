import { useEffect } from "react";

// Module-level — updated in the capture phase, so it is always current by the
// time React's bubble-phase handlers (e.g. handleGridPointerDown) run.
const _pointers = new Map<number, { x: number; y: number }>();
let _lastCentroid: { x: number; y: number } | null = null;

/** Current number of active pointers tracked across the whole page. */
export function getPointerCount(): number {
	return _pointers.size;
}

function getCentroid() {
	let sumX = 0;
	let sumY = 0;
	for (const p of _pointers.values()) {
		sumX += p.x;
		sumY += p.y;
	}
	return { x: sumX / _pointers.size, y: sumY / _pointers.size };
}

/**
 * Mount once at the app root (web only).
 *
 * Tracks all pointer contacts.  When 3 or more are active simultaneously it
 * computes the centroid delta each frame and calls window.scrollBy(), giving
 * 3-finger pan even on elements that have touch-action:none.
 */
export function useThreeFingerPan(): void {
	useEffect(() => {
		if (typeof window === "undefined") return;

		function handleDown(e: PointerEvent) {
			_pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
			if (_pointers.size >= 3) {
				_lastCentroid = getCentroid();
			}
		}

		function handleMove(e: PointerEvent) {
			if (!_pointers.has(e.pointerId)) return;
			_pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
			if (_pointers.size >= 3 && _lastCentroid) {
				const current = getCentroid();
				window.scrollBy(
					_lastCentroid.x - current.x,
					_lastCentroid.y - current.y,
				);
				_lastCentroid = current;
			}
		}

		function handleUp(e: PointerEvent) {
			_pointers.delete(e.pointerId);
			if (_pointers.size < 3) {
				_lastCentroid = null;
			}
		}

		// capture: true → fires before React's bubble-phase synthetic events
		window.addEventListener("pointerdown", handleDown, { capture: true });
		window.addEventListener("pointermove", handleMove, { capture: true });
		window.addEventListener("pointerup", handleUp, { capture: true });
		window.addEventListener("pointercancel", handleUp, { capture: true });

		return () => {
			window.removeEventListener("pointerdown", handleDown, { capture: true });
			window.removeEventListener("pointermove", handleMove, { capture: true });
			window.removeEventListener("pointerup", handleUp, { capture: true });
			window.removeEventListener("pointercancel", handleUp, { capture: true });
		};
	}, []);
}
