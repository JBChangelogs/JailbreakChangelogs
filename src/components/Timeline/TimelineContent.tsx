import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { fetchChangelogList } from '@/utils/api';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import localFont from "next/font/local";

const luckiestGuy = localFont({ 
  src: '../../../public/fonts/LuckiestGuy.ttf',
});

interface Changelog {
  id: number;
  title: string;
  image_url: string;
}

const TimelineContent: React.FC = () => {
  const [changelogs, setChangelogs] = useState<Changelog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadChangelogs = async () => {
      try {
        const data = await fetchChangelogList();
        // Sort by ID in descending order (newest first)
        const sortedData = [...data].sort((a, b) => b.id - a.id);
        setChangelogs(sortedData);
      } catch (err) {
        setError('Failed to load changelogs');
        console.error('Error loading changelogs:', err);
      } finally {
        setLoading(false);
      }
    };

    loadChangelogs();
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const
      }
    }
  };

  const timelineLineVariants = {
    hidden: { scaleY: 0 },
    visible: { 
      scaleY: 1,
      transition: {
        duration: 1.5,
        ease: "easeInOut" as const
      }
    }
  };

  if (loading) {
    return (
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {[...Array(3)].map((_, i) => (
          <motion.div 
            key={i} 
            className="animate-pulse"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="aspect-video bg-[#37424D] rounded-lg mb-2"></div>
            <div className="h-6 bg-[#37424D] rounded w-3/4"></div>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="rounded-lg bg-red-500/20 p-4 text-red-500"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {error}
      </motion.div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical timeline line */}
      <motion.div 
        className="absolute left-0 md:left-1/2 top-0 bottom-0 w-1 bg-[#5865F2] md:-translate-x-1/2"
        variants={timelineLineVariants}
        initial="hidden"
        animate="visible"
      />
      
      <motion.div 
        className="space-y-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {changelogs.map((changelog, index) => (
          <motion.div 
            key={changelog.id} 
            className={`relative flex ${index % 2 === 0 ? 'md:justify-start' : 'md:justify-end'}`}
            variants={cardVariants}
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
          >
            {/* Connector line */}
            <motion.div 
              className={`absolute top-1/2 w-1/2 h-0.5 bg-[#5865F2] ${index % 2 === 0 ? 'left-0' : 'right-0'}`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ 
                delay: 0.5 + index * 0.1,
                duration: 0.6,
                ease: "easeOut"
              }}
            />
            
            {/* Card */}
            <Link
              href={`/changelogs/${changelog.id}`}
              className={`group w-full md:w-[calc(45%-2rem)] ml-8 md:ml-0 relative z-10`}
            >
              <motion.div 
                className="rounded-lg border border-[#2E3944] bg-[#212A31] overflow-hidden"
                whileHover={{ 
                  borderColor: "#5865F2",
                  transition: { duration: 0.2 }
                }}
              >
                {changelog.image_url && (
                  <div className="relative aspect-video w-full">
                    <div className="absolute inset-0 flex items-center justify-center bg-[#212A31]">
                      <ArrowPathIcon className="h-6 w-6 text-[#5865F2] animate-spin" />
                    </div>
                    <Image
                      src={`https://assets.jailbreakchangelogs.xyz${changelog.image_url}`}
                      alt={changelog.title}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 45vw"
                      className="object-cover"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                )}
                <motion.div 
                  className="p-3"
                  whileHover={{ 
                    backgroundColor: "#1a2127",
                    transition: { duration: 0.2 }
                  }}
                >
                  <div className="flex flex-col gap-0.5">
                    <h3 className={`${luckiestGuy.className} text-xl font-semibold text-[#FFFFFF] group-hover:text-[#5865F2] transition-colors`}>
                      {changelog.title.split(' / ')[0]}
                    </h3>
                    <p className={`${luckiestGuy.className} text-sm text-muted`}>
                      {changelog.title.split(' / ')[1]}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default TimelineContent; 