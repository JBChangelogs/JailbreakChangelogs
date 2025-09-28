import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Changelog } from "@/utils/api";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], display: "swap" });

interface TimelineContentProps {
  changelogs: Changelog[];
}

const TimelineContent: React.FC<TimelineContentProps> = ({ changelogs }) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
      },
    },
  };

  const timelineLineVariants = {
    hidden: { scaleY: 0 },
    visible: {
      scaleY: 1,
      transition: {
        duration: 1.5,
        ease: "easeInOut" as const,
      },
    },
  };

  return (
    <div className="relative">
      {/* Vertical timeline line */}
      <motion.div
        className="bg-link absolute top-0 bottom-0 left-0 w-1 md:left-1/2 md:-translate-x-1/2"
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
            className={`relative flex ${index % 2 === 0 ? "md:justify-start" : "md:justify-end"}`}
            variants={cardVariants}
            whileHover={{
              scale: 1.02,
              transition: { duration: 0.2 },
            }}
          >
            {/* Connector line */}
            <motion.div
              className={`bg-link absolute top-1/2 h-0.5 w-1/2 ${index % 2 === 0 ? "left-0" : "right-0"}`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{
                delay: 0.5 + index * 0.1,
                duration: 0.6,
                ease: "easeOut",
              }}
            />

            {/* Card */}
            <Link
              href={`/changelogs/${changelog.id}`}
              className={`group relative z-10 ml-8 w-full md:ml-0 md:w-[calc(45%-2rem)]`}
            >
              <motion.div className="border-border-primary bg-secondary-bg overflow-hidden rounded-lg border">
                {changelog.image_url && (
                  <div className="relative aspect-video w-full">
                    <div className="bg-primary-bg absolute inset-0 flex items-center justify-center">
                      <ArrowPathIcon className="text-link h-6 w-6 animate-spin" />
                    </div>
                    <Image
                      src={`https://assets.jailbreakchangelogs.xyz/assets${changelog.image_url}`}
                      alt={changelog.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 45vw"
                      className="object-cover"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                )}
                <motion.div
                  className="p-3"
                  whileHover={{
                    backgroundColor: "var(--color-secondary-bg)",
                    transition: { duration: 0.2 },
                  }}
                >
                  <div className="flex flex-col gap-0.5">
                    <h3
                      className={`${inter.className} --xl text-primary-text group-hover:text-link-hover font-bold tracking-tighter transition-colors`}
                    >
                      {changelog.title.split(" / ")[0]}
                    </h3>
                    <p
                      className={`${inter.className} text-secondary-text text-sm font-semibold tracking-tight`}
                    >
                      {changelog.title.split(" / ")[1]}
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
