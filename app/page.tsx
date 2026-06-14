'use client';

import { motion } from 'framer-motion';
import DashboardPage from '../components/DashboardPage';

export default function Home() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <DashboardPage />
      </motion.div>
    </div>
  );
}
