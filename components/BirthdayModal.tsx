"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface BirthdayValue {
    day: number;
    month: number; // 1-12
    year: number;
}

interface BirthdayModalProps {
    open: boolean;
    onClose: () => void;
    value: BirthdayValue | null;
    onChange: (val: BirthdayValue) => void;
}

export default function BirthdayModal({
    open,
    onClose,
    value,
    onChange,
}: BirthdayModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 80 }, (_, i) => currentYear - i); // last 80 years
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];

    const [day, setDay] = useState<number>(11);
    const [month, setMonth] = useState<number>(11); // 1-12
    const [year, setYear] = useState<number>(2005);

    // individual scroll containers
    const dayRef = useRef<HTMLDivElement | null>(null);
    const monthRef = useRef<HTMLDivElement | null>(null);
    const yearRef = useRef<HTMLDivElement | null>(null);

    const dayScrollTimeoutRef = useRef<number | null>(null);
    const monthScrollTimeoutRef = useRef<number | null>(null);
    const yearScrollTimeoutRef = useRef<number | null>(null);

    // sync local state with incoming value
    useEffect(() => {
        if (value) {
            setDay(value.day);
            setMonth(value.month);
            setYear(value.year);
        }
    }, [value]);

    // open / close animation (same pattern as SexModal / RestTimerModal)
    useEffect(() => {
        if (open) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            setShouldRender(true);
            setTimeout(() => setIsVisible(true), 10);
        } else {
            setIsVisible(false);
            timeoutRef.current = setTimeout(() => {
                setShouldRender(false);
            }, 300);
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [open]);

    // --- helpers: scroll selected value into center band ---

    const scrollToDay = useCallback(
        (value: number, behavior: ScrollBehavior = "auto") => {
            const container = dayRef.current;
            if (!container) return;

            const items = Array.from(
                container.querySelectorAll<HTMLButtonElement>("[data-option='day']")
            );
            const index = days.indexOf(value);
            if (index === -1 || !items[index]) return;

            const el = items[index];
            const offset =
                el.offsetTop + el.offsetHeight / 2 - container.clientHeight / 2;
            container.scrollTo({ top: offset, behavior });
        },
        [days]
    );

    const scrollToMonth = useCallback(
        (value: number, behavior: ScrollBehavior = "auto") => {
            const container = monthRef.current;
            if (!container) return;

            const items = Array.from(
                container.querySelectorAll<HTMLButtonElement>("[data-option='month']")
            );
            const index = value - 1;
            if (index < 0 || !items[index]) return;

            const el = items[index];
            const offset =
                el.offsetTop + el.offsetHeight / 2 - container.clientHeight / 2;
            container.scrollTo({ top: offset, behavior });
        },
        []
    );

    const scrollToYear = useCallback(
        (value: number, behavior: ScrollBehavior = "auto") => {
            const container = yearRef.current;
            if (!container) return;

            const items = Array.from(
                container.querySelectorAll<HTMLButtonElement>("[data-option='year']")
            );
            const index = years.indexOf(value);
            if (index === -1 || !items[index]) return;

            const el = items[index];
            const offset =
                el.offsetTop + el.offsetHeight / 2 - container.clientHeight / 2;
            container.scrollTo({ top: offset, behavior });
        },
        [years]
    );

    // when modal opens, center the current value in each column
    useEffect(() => {
        if (!open) return;
        const id = window.requestAnimationFrame(() => {
            scrollToDay(day, "auto");
            scrollToMonth(month, "auto");
            scrollToYear(year, "auto");
        });
        return () => window.cancelAnimationFrame(id);
    }, [open, day, month, year, scrollToDay, scrollToMonth, scrollToYear]);

    // --- snap handlers (same idea as RestTimerModal.handleScroll) ---

    const makeSnapHandler = (
        containerRef: React.RefObject<HTMLDivElement | null>,
        timeoutRef: React.MutableRefObject<number | null>,
        getOptions: () => number[],
        getValueFromIndex: (index: number) => number,
        updateValue: (v: number) => void
    ) => {
        return () => {
            if (!containerRef.current) return;

            if (timeoutRef.current !== null) {
                window.clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = window.setTimeout(() => {
                const container = containerRef.current;
                if (!container) return;

                const items = Array.from(
                    container.querySelectorAll<HTMLButtonElement>("[data-option]")
                );
                if (!items.length) return;

                const containerRect = container.getBoundingClientRect();
                const centerY = containerRect.top + containerRect.height / 2;

                let closestIndex = 0;
                let minDist = Infinity;

                items.forEach((el, index) => {
                    const rect = el.getBoundingClientRect();
                    const itemCenter = rect.top + rect.height / 2;
                    const dist = Math.abs(centerY - itemCenter);
                    if (dist < minDist) {
                        minDist = dist;
                        closestIndex = index;
                    }
                });

                const nearestValue = getValueFromIndex(closestIndex);
                updateValue(nearestValue);
            }, 80) as unknown as number;

        };
    };

    const handleDayScroll = makeSnapHandler(
        dayRef,
        dayScrollTimeoutRef,
        () => days,
        (index) => days[index],
        (v) => {
            setDay(v);
            onChange({ day: v, month, year });
            scrollToDay(v, "smooth");
        }
    );

    const handleMonthScroll = makeSnapHandler(
        monthRef,
        monthScrollTimeoutRef,
        () => months.map((_, i) => i + 1),
        (index) => index + 1,
        (v) => {
            setMonth(v);
            onChange({ day, month: v, year });
            scrollToMonth(v, "smooth");
        }
    );

    const handleYearScroll = makeSnapHandler(
        yearRef,
        yearScrollTimeoutRef,
        () => years,
        (index) => years[index],
        (v) => {
            setYear(v);
            onChange({ day, month, year: v });
            scrollToYear(v, "smooth");
        }
    );

    // cleanup all timers on unmount
    useEffect(() => {
        return () => {
            if (dayScrollTimeoutRef.current !== null)
                window.clearTimeout(dayScrollTimeoutRef.current);
            if (monthScrollTimeoutRef.current !== null)
                window.clearTimeout(monthScrollTimeoutRef.current);
            if (yearScrollTimeoutRef.current !== null)
                window.clearTimeout(yearScrollTimeoutRef.current);
        };
    }, []);

    if (!shouldRender) return null;

    return (
        <>
            {/* Overlay (closes on tap) */}
            <div
                className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ease-in-out ${isVisible ? "opacity-100" : "opacity-0"
                    }`}
                onClick={onClose}
                style={{ pointerEvents: isVisible ? "auto" : "none" }}
            />

            {/* Bottom sheet */}
            <div
                className={`fixed bottom-0 left-0 right-0 z-50 bg-gray-100 dark:bg-gray-800 rounded-t-[30px] shadow-lg transition-all duration-300 ease-in-out min-h-[30vh] ${isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag handle */}
                <div className="flex justify-center pt-2">
                    <div className="h-1 w-15 bg-gray-400 rounded-lg" />
                </div>

                {/* Title */}
                <div className="text-center border-b border-gray-200 dark:border-gray-600 -mx-6 px-6">
                    <h2 className="text-sm font-regular my-4">Birthday</h2>
                </div>

                {/* Pickers – same visual style as RestTimerModal */}
                <div className="px-6 py-5 pb-8">
                    <div className="relative mb-2">
                        {/* center highlight band across ALL three columns */}
                        <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-y-1/2 h-12 rounded-2xl bg-gray-100" />

                        <div className="relative z-10 flex justify-between gap-4">
                            {/* Day column */}
                            <div className="w-full">
                                <div
                                    ref={dayRef}
                                    onScroll={handleDayScroll}
                                    className="relative h-48 overflow-y-auto py-4 space-y-1 no-scrollbar"
                                >

                                    {/* TOP SPACER */}
                                    <div className="h-12" />
                                    <div className="h-12" />

                                    {days.map((d) => {
                                        const isActive = d === day;
                                        return (
                                            <button
                                                key={d}
                                                type="button"
                                                data-option="day"
                                                onClick={() => {
                                                    setDay(d);
                                                    onChange({ day: d, month, year });
                                                    scrollToDay(d, "smooth");
                                                }}
                                                className={`w-full py-4 text-lg text-center transition ${isActive
                                                    ? "font-regular text-black bg-gray-200 dark:bg-gray-600 dark:text-gray-100 rounded-[10px]"
                                                    : "text-gray-400"
                                                    }`}
                                            >
                                                {d}
                                            </button>
                                        );
                                    })}

                                    {/* BOTTOM SPACER */}
                                    <div className="h-12" />
                                    <div className="h-12" />
                                </div>
                            </div>

                            {/* Month column */}
                            <div className="w-full">
                                <div
                                    ref={monthRef}
                                    onScroll={handleMonthScroll}
                                    className="relative h-48 overflow-y-auto py-4 space-y-1 no-scrollbar"
                                >

                                    {/* TOP SPACER */}
                                    <div className="h-12" />
                                    <div className="h-12" />

                                    {months.map((m, index) => {
                                        const mNum = index + 1;
                                        const isActive = mNum === month;
                                        return (
                                            <button
                                                key={m}
                                                type="button"
                                                data-option="month"
                                                onClick={() => {
                                                    setMonth(mNum);
                                                    onChange({ day, month: mNum, year });
                                                    scrollToMonth(mNum, "smooth");
                                                }}
                                                className={`w-full py-4 text-lg text-center transition ${isActive
                                                    ? "font-regular text-black bg-gray-200 dark:bg-gray-600 dark:text-gray-100 rounded-[10px]"
                                                    : "text-gray-400"
                                                    }`}
                                            >
                                                {m}
                                            </button>
                                        );
                                    })}

                                    {/* BOTTOM SPACER */}
                                    <div className="h-12" />
                                    <div className="h-12" />
                                </div>
                            </div>

                            {/* Year column */}
                            <div className="w-full">
                                <div
                                    ref={yearRef}
                                    onScroll={handleYearScroll}
                                    className="relative h-48 overflow-y-auto py-4 space-y-1 no-scrollbar"
                                >

                                    {/* TOP SPACER */}
                                    <div className="h-12" />
                                    <div className="h-12" />

                                    {years.map((y) => {
                                        const isActive = y === year;
                                        return (
                                            <button
                                                key={y}
                                                type="button"
                                                data-option="year"
                                                onClick={() => {
                                                    setYear(y);
                                                    onChange({ day, month, year: y });
                                                    scrollToYear(y, "smooth");
                                                }}
                                                className={`w-full py-4 text-lg text-center transition ${isActive
                                                    ? "font-regular text-black bg-gray-200 dark:bg-gray-600 dark:text-gray-100 rounded-[10px]"
                                                    : "text-gray-400"
                                                    }`}
                                            >
                                                {y}
                                            </button>
                                        );
                                    })}

                                    {/* BOTTOM SPACER */}
                                    <div className="h-12" />
                                    <div className="h-12" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
