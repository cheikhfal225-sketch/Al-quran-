import React, { useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X } from 'lucide-react';
import { ReciterId } from '../types/quran';
import { RECITERS } from '../services/quranService';

interface AudioBarProps {
  currentTrack: {
    title: string;
    arabicTitle?: string;
    audioUrl: string;
    surahId?: number;
    ayahNumber?: number;
  } | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  selectedReciter: ReciterId;
  onSelectReciter: (r: ReciterId) => void;
}

export const AudioBar: React.FC<AudioBarProps> = ({
  currentTrack,
  isPlaying,
  onTogglePlay,
  onClose,
  onNext,
  onPrev,
  selectedReciter,
  onSelectReciter,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);

  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    audioRef.current.src = currentTrack.audioUrl;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    }
  }, [currentTrack?.audioUrl]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime;
    const dur = audioRef.current.duration || 1;
    setCurrentTime(cur);
    setDuration(dur);
    setProgress((cur / dur) * 100);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newPercent = parseFloat(e.target.value);
    const newTime = (newPercent / 100) * (duration || 1);
    audioRef.current.currentTime = newTime;
    setProgress(newPercent);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!currentTrack) return null;

  const currentReciter = RECITERS.find((r) => r.id === selectedReciter) || RECITERS[0];

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-50 bg-[#176B45] text-white shadow-2xl border-t border-[#C5A45B]/40 transition-all">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          if (onNext) onNext();
          else onTogglePlay();
        }}
        preload="metadata"
      />
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Track Title */}
        <div className="flex items-center gap-3 min-w-0 max-w-[280px] md:max-w-xs">
          <div className="w-9 h-9 rounded-full bg-[#C5A45B] text-[#176B45] flex items-center justify-center font-bold text-xs shrink-0 shadow">
            {currentTrack.ayahNumber ? `${currentTrack.ayahNumber}` : '♫'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#F8F5EA] truncate">
              {currentTrack.title}
            </p>
            <p className="text-[11px] text-[#C5A45B] truncate font-arabic">
              {currentReciter.name_arabic} · {currentReciter.name_french}
            </p>
          </div>
        </div>

        {/* Controls and Seekbar */}
        <div className="flex-1 max-w-xl flex flex-col items-center">
          <div className="flex items-center gap-4">
            {onPrev && (
              <button
                onClick={onPrev}
                className="p-1.5 text-white/80 hover:text-white transition-colors"
                title="Précédent"
              >
                <SkipBack className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onTogglePlay}
              className="w-8 h-8 rounded-full bg-[#C5A45B] text-[#176B45] flex items-center justify-center hover:bg-[#d8b76c] transition-transform active:scale-95 shadow"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            {onNext && (
              <button
                onClick={onNext}
                className="p-1.5 text-white/80 hover:text-white transition-colors"
                title="Suivant"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="w-full flex items-center gap-2 mt-1">
            <span className="text-[10px] text-white/70 tabular-nums w-8 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={progress || 0}
              onChange={handleSeek}
              className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#C5A45B]"
            />
            <span className="text-[10px] text-white/70 tabular-nums w-8">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Reciter selector and Volume/Close */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden lg:flex items-center gap-1.5 text-xs">
            <label className="text-[11px] text-[#F8F5EA]/80 whitespace-nowrap">Récitateur:</label>
            <select
              value={selectedReciter}
              onChange={(e) => onSelectReciter(e.target.value as ReciterId)}
              className="bg-black/30 text-white text-xs rounded border border-[#C5A45B]/40 px-2 py-1 outline-none cursor-pointer"
            >
              {RECITERS.map((r) => (
                <option key={r.id} value={r.id} className="bg-[#176B45] text-white">
                  {r.name_french}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.muted = !muted;
                setMuted(!muted);
              }
            }}
            className="p-1 text-white/80 hover:text-white"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white hover:bg-black/20 rounded"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
