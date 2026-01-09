import { useEffect, useRef } from 'react';

interface VKPlayerProps {
  vkUrl: string;
  title: string;
}

export default function VKPlayer({ vkUrl, title }: VKPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const match = vkUrl.match(/video(-?\d+)_(\d+)/);
    if (!match || !containerRef.current) return;

    const [, oid, id] = match;
    const iframe = document.createElement('iframe');
    
    iframe.src = `https://vk.com/video_ext.php?oid=${oid}&id=${id}&hd=2`;
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock;';
    iframe.frameBorder = '0';
    iframe.allowFullscreen = true;
    iframe.style.position = 'absolute';
    iframe.style.top = '0';
    iframe.style.left = '0';
    
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(iframe);
  }, [vkUrl]);

  return (
    <div 
      ref={containerRef} 
      className="aspect-video bg-muted rounded-lg relative overflow-hidden"
      title={title}
    />
  );
}
