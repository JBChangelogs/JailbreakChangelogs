import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-video bg-[#37424D] rounded-lg mb-2"></div>
            <div className="h-6 bg-[#37424D] rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-500/20 p-4 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical timeline line */}
      <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-1 bg-[#5865F2] md:-translate-x-1/2" />
      
      <div className="space-y-16">
        {changelogs.map((changelog, index) => (
          <div key={changelog.id} className={`relative flex ${index % 2 === 0 ? 'md:justify-start' : 'md:justify-end'}`}>
            {/* Connector line */}
            <div className={`absolute top-1/2 w-1/2 h-0.5 bg-[#5865F2] ${index % 2 === 0 ? 'left-0' : 'right-0'}`} />
            
            {/* Card */}
            <Link
              href={`/changelogs/${changelog.id}`}
              className={`group w-full md:w-[calc(45%-2rem)] ml-8 md:ml-0 relative z-10`}
            >
              <div className="rounded-lg border border-[#2E3944] bg-[#212A31] overflow-hidden transition-transform group-hover:scale-[1.02]">
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
                <div className="p-3">
                  <div className="flex flex-col gap-0.5">
                    <h3 className={`${luckiestGuy.className} text-xl font-semibold text-[#FFFFFF] group-hover:text-[#5865F2] transition-colors`}>
                      {changelog.title.split(' / ')[0]}
                    </h3>
                    <p className={`${luckiestGuy.className} text-sm text-muted`}>
                      {changelog.title.split(' / ')[1]}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineContent; 