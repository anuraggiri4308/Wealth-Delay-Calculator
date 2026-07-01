import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = ["#0fae6b", "#6d5bd0", "#d4af37", "#e5484d", "#0e9488", "#f2790f"];

interface Piece {
  id: number;
  x: number;
  rotate: number;
  color: string;
  delay: number;
  scale: number;
}

export default function Confetti({ trigger }: { trigger: boolean }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!trigger) return;
    const newPieces: Piece[] = Array.from({ length: 60 }).map((_, i) => ({
      id: i + Date.now(),
      x: Math.random() * 100,
      rotate: Math.random() * 360,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 0.4,
      scale: 0.6 + Math.random() * 0.8,
    }));
    setPieces(newPieces);
    const t = setTimeout(() => setPieces([]), 2600);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {pieces.map((p) => (
          <motion.div
            key={p.id}
            initial={{ y: -40, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
            animate={{ y: "110vh", rotate: p.rotate + 360, opacity: [1, 1, 0.8, 0] }}
            transition={{ duration: 2.2, delay: p.delay, ease: "easeIn" }}
            style={{
              position: "absolute",
              width: 8 * p.scale,
              height: 14 * p.scale,
              background: p.color,
              borderRadius: 2,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
