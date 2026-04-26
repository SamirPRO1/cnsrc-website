const TRACKS: Record<string, string> = {
  bahrain:    "M 80 240 C 60 180 80 120 160 110 C 260 96 320 140 340 200 C 360 260 420 280 500 270 C 580 262 640 236 720 250 C 800 262 850 300 850 350 C 850 410 790 460 700 440 C 620 422 580 380 520 380 C 460 380 420 420 360 430 C 280 442 180 430 120 380 C 70 336 100 300 80 240 Z",
  interlagos: "M 100 300 C 90 240 140 180 220 170 C 320 156 380 200 440 200 C 520 200 540 160 620 160 C 720 160 800 210 820 270 C 840 330 790 380 720 388 C 640 396 580 360 500 370 C 420 380 360 440 260 440 C 160 440 110 380 100 300 Z",
  laguna:     "M 120 260 C 110 210 160 170 230 180 C 300 190 320 250 380 250 C 440 250 480 200 560 200 C 640 200 690 250 680 310 C 670 360 620 380 560 360 C 500 340 480 380 420 400 C 350 424 270 430 200 400 C 140 374 130 310 120 260 Z",
  indy:       "M 120 200 L 800 200 A 60 140 0 0 1 800 440 L 120 440 A 60 140 0 0 1 120 200 Z",
  cota:       "M 100 280 C 120 200 200 170 280 200 C 340 220 360 280 420 280 C 480 280 500 220 580 210 C 680 198 760 230 800 300 C 840 380 790 430 700 420 C 620 412 580 380 520 380 C 460 380 420 420 340 430 C 240 442 120 410 100 340 C 94 316 96 298 100 280 Z",
  sonoma:     "M 120 220 C 160 180 230 180 270 220 C 310 260 280 310 320 340 C 360 370 430 340 480 370 C 530 400 560 440 620 430 C 700 418 770 380 780 320 C 790 260 720 220 660 230 C 600 240 580 210 540 180 C 500 150 420 140 360 170 C 290 204 200 180 160 200 C 130 214 120 220 120 220 Z",
  jeddah:     "M 120 220 L 200 220 L 210 260 L 280 260 L 290 200 L 400 200 L 410 240 L 540 240 L 550 200 L 720 200 L 730 260 L 820 260 L 820 400 L 700 400 L 690 360 L 540 360 L 530 410 L 400 410 L 390 380 L 260 380 L 250 410 L 140 410 L 120 350 Z",
  sebring:    "M 120 220 C 180 180 280 190 340 220 C 400 250 420 210 500 210 C 580 210 620 260 680 260 C 740 260 780 230 820 260 C 860 290 840 350 780 370 C 720 390 680 360 620 380 C 560 400 540 440 460 430 C 380 420 340 380 260 400 C 180 420 120 390 100 340 C 90 300 110 250 120 220 Z",
  singapore:  "M 120 240 L 220 240 L 230 280 L 320 280 L 330 220 L 460 220 L 470 260 L 600 260 L 610 220 L 720 220 L 730 280 L 820 280 L 820 400 L 680 400 L 670 360 L 520 360 L 510 410 L 360 410 L 350 380 L 220 380 L 210 410 L 140 410 L 120 360 Z",
  roadamerica:"M 120 220 C 180 180 280 200 340 240 C 400 280 360 340 420 360 C 480 380 560 340 620 360 C 680 380 740 400 780 370 C 820 340 810 280 760 260 C 710 240 680 210 620 210 C 560 210 500 240 440 220 C 380 200 260 180 200 200 C 160 214 130 210 120 220 Z",
};

interface TrackSilhouetteProps {
  track: string;
  opacity?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function TrackSilhouette({
  track,
  opacity = 0.08,
  strokeWidth = 2,
  className,
  style,
}: TrackSilhouetteProps) {
  const d = TRACKS[track] ?? TRACKS.bahrain;
  return (
    <svg
      viewBox="0 0 920 560"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      style={{ width: "100%", height: "100%", ...style }}
      role="img"
      aria-label={`${track} circuit layout`}
    >
      <path
        d={d}
        fill="none"
        stroke="rgba(255,255,255,1)"
        strokeOpacity={opacity}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface CompoundSilhouettesProps {
  tracks: string[];
  opacity?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function CompoundSilhouettes({
  tracks,
  opacity = 0.07,
  className,
  style,
}: CompoundSilhouettesProps) {
  return (
    <svg
      viewBox="0 0 920 560"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      style={{ width: "100%", height: "100%", ...style }}
      role="img"
      aria-label="Multiple circuit layouts"
    >
      {tracks.map((t, i) => (
        <path
          key={t + i}
          d={TRACKS[t] ?? TRACKS.bahrain}
          fill="none"
          stroke="rgba(255,255,255,1)"
          strokeOpacity={opacity * (1 - i * 0.1)}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          transform={`translate(${(i % 3) * 20 - 20} ${(i % 2) * 14 - 8})`}
        />
      ))}
    </svg>
  );
}

export { TRACKS };
