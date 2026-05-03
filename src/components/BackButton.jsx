import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
    >
      <ArrowLeft size={14} /> Back
    </button>
  );
}