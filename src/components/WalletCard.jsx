import React from "react";
export default function WalletCard({
  title,
  description,
  createdAt,
  icon: Icon,
  onClick,
  variant = "primary",
}) {
  const dateStr = createdAt ? new Date(createdAt).toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric'
  }) : null;

  return (
    <button
      onClick={onClick}
      className={`w-full p-5 rounded-2xl border transition-all flex items-center gap-4 text-left
      ${
        variant === "primary"
          ? "bg-cyan-500/10 border-cyan-500/20 hover:bg-cyan-500/20"
          : "bg-[#1e2329] border-[#2b3139] hover:bg-[#2b3139]"
      }`}
    >
      {/* ICON */}
      <div className="p-3 rounded-xl bg-black/30">
        {Icon && <Icon size={22} className="text-cyan-400" />}
      </div>

      {/* TEXT */}
      <div className="flex-1">
        <div className="flex justify-between items-center w-full">
          <h3 className="font-bold text-white">{title}</h3>
          {dateStr && <span className="text-[10px] text-gray-500 font-mono uppercase">{dateStr}</span>}
        </div>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </button>
  );
}