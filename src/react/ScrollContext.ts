import { createContext, useContext } from "react";

interface ScrollContextValue {
	scrollTo: (y: number) => void;
	scrollYRef: React.MutableRefObject<number> | null;
}

export const ScrollContext = createContext<ScrollContextValue>({
	scrollTo: () => {},
	scrollYRef: null,
});

export const useScrollContext = () => useContext(ScrollContext);
