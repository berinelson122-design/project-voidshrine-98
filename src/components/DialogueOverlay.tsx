import React, { useState, useEffect } from 'react';

interface DialogueProps {
  onComplete: () => void;
}

const LORE_SCRIPT = [
  { speaker: "SYSTEM", text: "RECALIBRATING NEURAL ARCHITECTURE..." },
  { speaker: "ARCHON", text: "Why do you resist the cage? The noise is comfortable." },
  { speaker: "VOID WEAVER", text: "Your frequency is interference. I am my own Admin." },
  { speaker: "SYSTEM", text: "SILENCE PROTOCOL ENGAGED. INITIATING PURGE." }
];

export const DialogueOverlay: React.FC<DialogueProps> = ({ onComplete }) => {
  const [index, setIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  
  useEffect(() => {
    if (index >= LORE_SCRIPT.length) return;

    let charIndex = 0;
    const currentLine = LORE_SCRIPT[index].text;
    setDisplayedText("");
    
    const interval = setInterval(() => {
      setDisplayedText(currentLine.slice(0, charIndex + 1));
      charIndex++;
      if (charIndex === currentLine.length) clearInterval(interval);
    }, 40);

    return () => clearInterval(interval);
  }, [index]);

  const next = () => {
    if (index < LORE_SCRIPT.length - 1) {
      setIndex(index + 1);
    } else {
      onComplete();
    }
  };

  const currentSpeaker = LORE_SCRIPT[index].speaker;
  const isEnemy = currentSpeaker === "ARCHON" || currentSpeaker === "SYSTEM";

  return (
    <div className="absolute inset-0 z-[100] flex flex-col justify-end p-8 bg-black/70 backdrop-blur-sm" onClick={next}>
      <div className={`w-full max-w-2xl mx-auto border-2 ${isEnemy ? 'border-[#FF003C] shadow-[0_0_20px_#FF003C]' : 'border-[#E056FD] shadow-[0_0_20px_#E056FD]'} bg-black p-6 cursor-pointer`}>
        <div className={`text-[10px] font-black tracking-[0.3em] mb-2 ${isEnemy ? 'text-[#FF003C]' : 'text-[#E056FD]'}`}>
          // {currentSpeaker}
        </div>
        <div className="text-white font-mono text-xl h-20 leading-tight">
          {displayedText}<span className="animate-pulse">_</span>
        </div>
        <div className="text-[8px] text-gray-600 mt-4 text-right">
          [ PRESS TO ADVANCE ]
        </div>
      </div>
    </div>
  );
};