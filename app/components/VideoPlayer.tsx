import { useState } from "react";

import { videoThumbnail, type Presentation } from "~/lib/content";

type Props = {
  video: Pick<Presentation, "videoProvider" | "videoRef">;
  title: string;
};

// Shows the thumbnail first and loads YouTube (privacy-enhanced domain) only
// when the reader asks for it.
export function VideoPlayer({ video, title }: Props) {
  const [playing, setPlaying] = useState(false);
  if (video.videoProvider !== "youtube" || !video.videoRef) return null;
  const id = encodeURIComponent(video.videoRef);

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-masthead">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 block"
        >
          {/* YouTube's hqdefault is 4:3 with baked-in bars; cover-cropping to 16:9 removes them. */}
          <img
            src={videoThumbnail(video) ?? undefined}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <span className="absolute start-4 bottom-4 inline-flex items-center gap-2 rounded-control bg-masthead px-4 py-3 text-label text-on-masthead transition-colors group-hover:bg-accent group-hover:text-on-accent">
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 fill-current">
              <path d="M4 2.5v11l9-5.5z" />
            </svg>
            Play video
          </span>
        </button>
      )}
    </div>
  );
}
