import React, { useEffect, useRef } from 'react';
import Artplayer from 'artplayer';
import Hls from 'hls.js';
import artplayerPluginHlsControl from 'artplayer-plugin-hls-control';

export default function FilmPlayer({ url, title, poster, onReady }) {
  const artRef = useRef(null);

  useEffect(() => {
    Artplayer.LOG_VERSION = false;
    Artplayer.CONTEXTMENU = false;

    const art = new Artplayer({
      container: artRef.current,
      url: url,
      type: 'm3u8',
      title: title || 'Nonton Film',
      poster: poster,
      volume: 1,
      isLive: false,
      muted: false,
      autoplay: true,
      pip: true,
      autoSize: true,
      autoMini: true,
      screenshot: true,
      setting: true,
      loop: false,
      flip: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      subtitleOffset: true,
      miniProgressBar: true,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: true,
      airplay: true,
      theme: '#ffbade',
      customType: {
        m3u8: function (video, url, art) {
          if (Hls.isSupported()) {
            if (art.hls) art.hls.destroy();
            const hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(video);
            art.hls = hls;
            art.on('destroy', () => hls.destroy());
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
          } else {
            art.notice.show = 'Unsupported video format: m3u8';
          }
        },
      },
      plugins: [
        artplayerPluginHlsControl({
          quality: {
            control: true,
            setting: true,
            getName: (level) => level.height + 'P',
            title: 'Quality',
            auto: 'Auto',
          },
          audio: {
            control: true,
            setting: true,
            getName: (track) => track.name,
            title: 'Audio',
            auto: 'Auto',
          }
        }),
      ],
    });

    if (onReady) {
      onReady(art);
    }

    return () => {
      if (art && art.destroy) {
        art.destroy(false);
      }
    };
  }, [url, title, poster]);

  return <div ref={artRef} style={{ width: '100%', height: '100%' }}></div>;
}
