'use client';

import { useEffect, useState } from 'react';

export function VideoBackground() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-0 opacity-20">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
        // To make this work, add your video file to the /public folder
        // For example: /public/background.mp4
        src="/background.mp4"
      >
        Your browser does not support the video tag.
      </video>
      <div className="absolute inset-0 bg-black/50" />
    </div>
  );
}
