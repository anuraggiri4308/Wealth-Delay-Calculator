import { useEffect, useRef, useState } from "react";
import { motion, useSpring } from "framer-motion";
import { formatINR } from "../lib/calc";

interface AnimatedNumberProps {
  value: number;
  compact?: boolean;
  className?: string;
  prefix?: string;
}

export default function AnimatedNumber({ value, compact = false, className = "" }: AnimatedNumberProps) {
  const spring = useSpring(0, { stiffness: 90, damping: 22, mass: 0.6 });
  const [display, setDisplay] = useState("₹0");
  const mounted = useRef(false);

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsub = spring.on("change", (v) => {
      setDisplay(formatINR(v, compact));
    });
    return unsub;
  }, [spring, compact]);

  useEffect(() => {
    mounted.current = true;
  }, []);

  return (
    <motion.span className={`font-mono-num tabular-nums ${className}`}>
      {display}
    </motion.span>
  );
}
