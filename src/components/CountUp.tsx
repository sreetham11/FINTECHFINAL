'use client';

import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface CountUpProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export default function CountUp({ value, duration = 1.5, prefix = '', suffix = '', decimals = 0, className = '' }: CountUpProps) {
  const [mounted, setMounted] = useState(false);
  const spring = useSpring(0, { duration: duration * 1000, bounce: 0 });
  const displayValue = useTransform(spring, (current) => {
    return prefix + current.toFixed(decimals) + suffix;
  });

  useEffect(() => {
    setMounted(true);
    spring.set(value);
  }, [value, spring]);

  if (!mounted) {
    return <span className={className}>{prefix}{(0).toFixed(decimals)}{suffix}</span>;
  }

  return <motion.span className={className}>{displayValue}</motion.span>;
}
