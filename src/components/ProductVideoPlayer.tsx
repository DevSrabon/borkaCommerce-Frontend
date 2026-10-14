'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play } from 'lucide-react';

interface ProductVideoPlayerProps {
  videoUrl?: string;
  productName: string;
  onBackToPhotos?: () => void;
  className?: string;
}

/**
 * Extracts YouTube video ID and builds a clean embed URL
 * Keeps YouTube native controls and privacy parameters (rel=0, modestbranding=1, iv_load_policy=3, playsinline=1).
 */
export function getCleanYoutubeEmbedUrl(
  url?: string,
  options: {
    autoplay?: boolean;
  } = {}
): { embedUrl: string; videoId: string } {
  if (!url) return { embedUrl: '', videoId: '' };
  const trimmed = url.trim();
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = trimmed.match(regExp);
  if (!match || match[2].length !== 11) return { embedUrl: '', videoId: '' };
  const videoId = match[2];

  const params = new URLSearchParams({
    autoplay: options.autoplay !== false ? '1' : '0',
    rel: '0',                    // Restrict related videos to current channel only
    modestbranding: '1',         // Clean YouTube logo
    iv_load_policy: '3',         // Hide annotations & cards
    playsinline: '1',            // Play inline on mobile
    enablejsapi: '1',            // Enable JavaScript API for programmatic playback control
  });

  return {
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`,
    videoId,
  };
}

export default function ProductVideoPlayer({
  videoUrl,
  productName,
  className = '',
}: ProductVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { embedUrl, videoId } = getCleanYoutubeEmbedUrl(videoUrl, {
    autoplay: true,
  });

  // PostMessage helper to send commands to YouTube Iframe
  const sendCommand = useCallback((func: string, args: any[] = []) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      );
    }
  }, []);

  // Listen to YouTube player state changes via postMessage
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data?.event === 'onStateChange') {
          // 1 = playing, 2 = paused, 0 = ended
          if (data.info === 1) setIsPlaying(true);
          if (data.info === 2 || data.info === 0) setIsPlaying(false);
        }
      } catch {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleCenterPlay = () => {
    sendCommand('playVideo');
    setIsPlaying(true);
  };

  if (!embedUrl || !videoId) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-950 text-zinc-400 text-xs">
        Invalid or missing video link.
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full bg-black overflow-hidden select-none ${className}`}>
      {/* YouTube Native Iframe */}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        title={`${productName} Video`}
        className="w-full h-full border-0 absolute inset-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />

      {/* Center Play Button ONLY (shows when video is paused/stopped) */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 animate-in fade-in duration-200">
          <button
            type="button"
            onClick={handleCenterPlay}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/95 text-primary-foreground flex items-center justify-center shadow-2xl backdrop-blur-md transform transition hover:scale-110 active:scale-95 pointer-events-auto cursor-pointer"
            aria-label="Play video"
          >
            <Play size={28} className="fill-current ml-1" />
          </button>
        </div>
      )}
    </div>
  );
}
