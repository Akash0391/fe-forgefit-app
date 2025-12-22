"use client";

import { useEffect, useState, useRef } from "react";
import { Check, Ellipsis, Grip } from "lucide-react";

interface EquipmentModalProps {
  open: boolean;
  onClose: () => void;
  onAll: () => void;
  onNone: () => void;
  onBarbell: () => void;
  onKettlebell: () => void;
  onDumbell: () => void;
  onMachine: () => void;
  onPlate: () => void;
  onRBand: () => void;
  onSBand: () => void;
  onOther: () => void;
  selectedKey?: string;
}

export default function EquipmentModal({
  open,
  onClose,
  onAll,
  onNone,
  onBarbell,
  onKettlebell,
  onDumbell,
  onMachine,
  onPlate,
  onRBand,
  onSBand,
  onOther,
  selectedKey: externalSelectedKey,
}: EquipmentModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const [selectedKey, setSelectedKey] = useState<string>(externalSelectedKey ?? "all");

  useEffect(() => {
    if (externalSelectedKey) setSelectedKey(externalSelectedKey);
  }, [externalSelectedKey]);

  useEffect(() => {
    if (open) {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setShouldRender(true);
      window.setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      timeoutRef.current = window.setTimeout(() => setShouldRender(false), 300);
    }
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [open]);

  if (!shouldRender) return null;

  const menuItems = [
    { id: "all", label: "All Equipment", icon: "/icons/all.png", callback: onAll },
    { id: "none", label: "None", icon: "/icons/person.png", callback: onNone },
    { id: "barbell", label: "Barbell", icon: "/icons/barbell.png", callback: onBarbell },
    { id: "dumbell", label: "Dumbell", icon: "/icons/dumbell2.png", callback: onDumbell },
    { id: "kettlebell", label: "Kettlebell", icon: "/icons/kettlebell.png", callback: onKettlebell },
    { id: "machine", label: "Machine", icon: "/icons/machine.png", callback: onMachine },
    { id: "plate", label: "Plate", icon: "/icons/plates.png", callback: onPlate },
    { id: "rband", label: "Resistance Band", icon: "/icons/resistance-band.png", callback: onRBand },
    { id: "sband", label: "Suspension Band", icon: "/icons/suspension-band.png", callback: onSBand },
    { id: "other", label: "Other", icon: "/icons/ellipsis.png", callback: onOther },
  ];

  const handleItemClick = (item: typeof menuItems[number]) => {
    setSelectedKey(item.id);
    try { item.callback(); } catch {}
    onClose();
  };

  return (
    <>
      {/* overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ease-in-out ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        style={{ pointerEvents: isVisible ? "auto" : "none" }}
      />

      {/* bottom sheet: flex column with constrained height */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-gray-100 rounded-t-[20px] shadow-lg transition-all duration-300 ease-in-out max-h-[66vh] ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* header area (doesn't scroll) */}
        <div className="flex flex-col items-center pt-2 pb-3 mb-5 border-b border-gray-200">
          <div className="h-1.5 w-16 bg-gray-300 rounded-lg" />
          <div className="mt-5 mb-1">
            <h2 className="text-lg font-regular text-gray-800">Equipment</h2>
          </div>
        </div>

        {/* content area: white card is a column; the list is flex-1 and scrollable */}
        <div className="px-4 pb-4 h-full">
          <div className="bg-white rounded-[10px] overflow-hidden flex flex-col" style={{ maxHeight: "calc(60vh - 72px)" }}>
            {/* scrollable list: fills remaining space */}
            <div
              className="flex-1 overflow-y-auto divide-y divide-gray-100"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {menuItems.map((item) => {
                const Icon = item.icon;
                const checked = selectedKey === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="w-full flex items-center gap-4 h-[80px] px-5 py-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100 flex-shrink-0 overflow-hidden">
                      <img src={Icon} alt={item.label} className="w-12 h-12 object-contain" />
                    </div>

                    <span className="flex-1 text-lg text-gray-800">{item.label}</span>

                    <div className="w-8 h-8 flex items-center justify-center">
                      {checked ? (
                        <span className="flex items-center justify-center">
                          <Check className="size-8 text-blue-500" />
                        </span>
                      ) : (
                        <span className="w-6 h-6" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
