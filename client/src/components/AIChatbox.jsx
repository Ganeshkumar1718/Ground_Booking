import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, MessageSquare, ChevronRight, Zap } from 'lucide-react';

export default function AIChatbox({ ground, selectedSlot, selectedDate, selectedSport }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: `Hi! I'm the AI Assistant for ${ground?.name || 'this arena'}. How can I help you today?` }
  ]);
  const messagesEndRef = useRef(null);

  // Predefined questions
  const options = [
    { id: 'timings', label: 'What are the slot timings?' },
    { id: 'ball_type', label: 'What ball type is allowed?' },
    { id: 'advance', label: 'How much is the advance?' },
    { id: 'facilities', label: 'What facilities are available?' }
  ];

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleOptionClick = (optionId, optionLabel) => {
    // Add user message
    setMessages(prev => [...prev, { sender: 'user', text: optionLabel }]);

    // Simulate AI thinking delay
    setTimeout(() => {
      let aiResponse = "I'm not sure about that.";

      switch (optionId) {
        case 'timings':
          if (selectedSlot) {
            aiResponse = `The currently selected slot is from ${selectedSlot.start_time.slice(0, 5)} to ${selectedSlot.end_time.slice(0, 5)} on ${selectedDate}.`;
          } else {
            aiResponse = `Please select a date and check the "Available Slots" section to see all available timings.`;
          }
          break;
        case 'ball_type':
          if (selectedSport && selectedSport.name.toLowerCase().includes('cricket')) {
            if (selectedSlot && selectedSlot.ball_type) {
              aiResponse = `For the selected slot, the allowed ball type is: **${selectedSlot.ball_type}**.`;
            } else {
              aiResponse = `For cricket, the allowed ball type depends on the slot. Please select a slot to see specifics (e.g. Stitch Ball, Tennis Ball).`;
            }
          } else {
            aiResponse = `Ball type restrictions usually apply only to Cricket. You've currently selected ${selectedSport?.name || 'a different sport'}.`;
          }
          break;
        case 'advance':
          const advancePercent = ground?.advance_percentage || 20;
          if (selectedSlot) {
            const slotPrice = parseFloat(selectedSlot.price);
            const advanceAmount = (slotPrice * (advancePercent / 100)).toFixed(0);
            aiResponse = `The minimum advance payment for this ground is **${advancePercent}%**. For your selected slot (₹${slotPrice}), the advance amount is **₹${advanceAmount}**.`;
          } else {
            aiResponse = `The minimum advance payment for this ground is **${advancePercent}%** of the total slot price. Select a slot to see the exact amount!`;
          }
          break;
        case 'facilities':
          aiResponse = ground?.facilities 
            ? `This arena offers the following facilities: ${ground.facilities}.` 
            : `I don't have specific facility details for this ground, but it looks great!`;
          break;
        default:
          aiResponse = "Sorry, I can't answer that right now.";
      }

      setMessages(prev => [...prev, { sender: 'ai', text: aiResponse }]);
    }, 600);
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-emerald-500 hover:bg-emerald-600 text-slate-950 p-4 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-transform hover:scale-105 z-40 cursor-pointer flex items-center justify-center"
        >
          <Bot className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[340px] max-w-[calc(100vw-48px)] h-[500px] max-h-[calc(100vh-100px)] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden transform transition-all duration-300 ease-out">
          
          {/* Header */}
          <div className="bg-slate-950 border-b border-slate-800 p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-500/20 p-1.5 rounded-lg">
                <Bot className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">PlaySpot AI</h3>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <Zap className="h-3 w-3" /> Online
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                  msg.sender === 'user' 
                    ? 'bg-emerald-500 text-slate-950 rounded-tr-sm' 
                    : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm'
                }`}>
                  {/* Handle basic markdown bolding in text */}
                  {msg.text.split('**').map((part, i) => i % 2 === 1 ? <strong key={i} className={msg.sender === 'user' ? 'text-slate-900' : 'text-white'}>{part}</strong> : part)}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reply Chips Area */}
          <div className="bg-slate-950 border-t border-slate-800 p-3">
            <p className="text-[10px] text-slate-500 mb-2 font-semibold uppercase tracking-wider">Ask a question:</p>
            <div className="flex flex-wrap gap-2">
              {options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleOptionClick(opt.id, opt.label)}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] py-1.5 px-3 rounded-full transition cursor-pointer flex items-center gap-1 hover:text-emerald-400 hover:border-emerald-500/50"
                >
                  {opt.label} <ChevronRight className="h-3 w-3 opacity-50" />
                </button>
              ))}
            </div>
          </div>
          
        </div>
      )}
    </>
  );
}
