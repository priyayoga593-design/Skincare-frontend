import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, Pause, Maximize, Volume2, VolumeX, Sparkles, CheckCircle2, RotateCcw, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product, skinAnalysis } from "@/lib/mock-data";

export type TutorialStep = {
  id: string;
  description: string;
  narration: string;
  durationSeconds: number;
  product?: Product;
};

export type TutorialData = {
  title: string;
  kind: string;
  duration: string;
  steps: TutorialStep[];
};

export function AIVideoPlayer({ tutorial }: { tutorial: TutorialData }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showEndSlate, setShowEndSlate] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentStep = tutorial.steps[currentStepIdx];

  // Playback engine
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && currentStep && !showEndSlate) {
      const stepDurationMs = (currentStep.durationSeconds * 1000) / speed;
      const tickRate = 50; 
      const increment = (tickRate / stepDurationMs) * 100;

      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev + increment >= 100) {
            if (currentStepIdx < tutorial.steps.length - 1) {
              setCurrentStepIdx((idx) => idx + 1);
              return 0; 
            } else {
              setIsPlaying(false);
              setShowEndSlate(true);
              return 100;
            }
          }
          return prev + increment;
        });
      }, tickRate);
      
      if (videoRef.current) videoRef.current.play();
    } else {
      if (videoRef.current) videoRef.current.pause();
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentStepIdx, currentStep, speed, tutorial.steps.length, showEndSlate]);

  const togglePlay = () => {
    if (showEndSlate) {
      setShowEndSlate(false);
      setCurrentStepIdx(0);
      setProgress(0);
    }
    setIsPlaying(!isPlaying);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const jumpToStep = (idx: number) => {
    setCurrentStepIdx(idx);
    setProgress(0);
    setShowEndSlate(false);
    setIsPlaying(true);
  };

  const totalDuration = tutorial.steps.reduce((acc, step) => acc + step.durationSeconds, 0);
  const elapsedBeforeCurrent = tutorial.steps.slice(0, currentStepIdx).reduce((acc, step) => acc + step.durationSeconds, 0);
  const currentElapsed = currentStep && !showEndSlate ? (progress / 100) * currentStep.durationSeconds : 0;
  const overallProgressPercent = showEndSlate ? 100 : ((elapsedBeforeCurrent + currentElapsed) / totalDuration) * 100;

  return (
    <div ref={containerRef} className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl group flex flex-col font-sans">
      
      {/* Background AI Presenter Video Loop */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          src="https://cdn.pixabay.com/video/2021/08/25/86271-593674686_large.mp4" 
          loop
          muted={true}
          playsInline
          className={`w-full h-full object-cover transition-all duration-1000 ${showEndSlate ? 'blur-xl opacity-30' : 'opacity-90'}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/40" />
      </div>

      {/* Picture-in-Picture Product Showcase (Interactive Overlay) */}
      <AnimatePresence>
        {currentStep?.product && isPlaying && !showEndSlate && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9, rotateY: 20 }}
            animate={{ opacity: 1, x: 0, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, x: 50, scale: 0.9, rotateY: 20 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="absolute top-8 right-8 w-56 sm:w-72 bg-white/10 backdrop-blur-3xl border border-white/20 rounded-2xl p-5 shadow-2xl z-20"
            style={{ perspective: 1000 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="size-4 text-primary animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-widest text-white/90">AI Selected</span>
            </div>
            <div className="relative overflow-hidden rounded-xl bg-white mb-4 shadow-inner">
              <img src={currentStep.product.image} alt={currentStep.product.name} className="w-full h-32 object-cover hover:scale-110 transition-transform duration-700" />
            </div>
            <h4 className="text-sm font-bold text-white leading-tight mb-2">{currentStep.product.name}</h4>
            <div className="flex flex-col gap-1 text-xs text-white/70">
              <span className="bg-white/10 px-2 py-1 rounded inline-block w-fit">Use: {currentStep.product.usage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtitles / Script */}
      <div className="absolute bottom-28 left-0 right-0 px-12 z-20 flex flex-col items-center pointer-events-none">
        <AnimatePresence mode="wait">
          {!showEndSlate && (
            <motion.div
              key={currentStepIdx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-black/50 backdrop-blur-xl px-8 py-4 rounded-2xl border border-white/10 shadow-2xl max-w-3xl"
            >
              <p className="text-white text-lg sm:text-xl text-center font-medium drop-shadow-lg leading-relaxed">
                {currentStep?.narration || "Welcome to your personalized consultation."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* End Slate: Before & After Simulation */}
      <AnimatePresence>
        {showEndSlate && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 bg-black/60 backdrop-blur-sm"
          >
            <TrendingUp className="size-16 text-primary mb-6 animate-bounce" />
            <h2 className="text-3xl font-display text-white mb-8">AI Simulation Complete</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl w-full">
              <div className="p-6 rounded-3xl bg-white/10 border border-white/20 text-center backdrop-blur-md">
                <p className="eyebrow text-white/70 mb-2">Current</p>
                <p className="font-display text-5xl font-semibold text-white">{skinAnalysis.healthScore}</p>
              </div>
              <div className="p-6 rounded-3xl bg-primary/20 border border-primary/50 text-center backdrop-blur-md">
                <p className="eyebrow text-primary-foreground mb-2">7 Days</p>
                <p className="font-display text-5xl font-semibold text-white">+{Math.round((100 - skinAnalysis.healthScore) * 0.15)}</p>
              </div>
              <div className="p-6 rounded-3xl bg-primary/30 border border-primary/60 text-center backdrop-blur-md">
                <p className="eyebrow text-primary-foreground mb-2">30 Days</p>
                <p className="font-display text-5xl font-semibold text-white">+{Math.round((100 - skinAnalysis.healthScore) * 0.45)}</p>
              </div>
              <div className="p-6 rounded-3xl bg-primary/40 border border-primary/70 text-center backdrop-blur-md shadow-[0_0_30px_rgba(var(--primary),0.3)]">
                <p className="eyebrow text-primary-foreground mb-2">90 Days</p>
                <p className="font-display text-5xl font-semibold text-white">+{Math.round((100 - skinAnalysis.healthScore) * 0.75)}</p>
              </div>
            </div>
            
            <Button size="lg" className="mt-10 rounded-full" onClick={togglePlay}>
              <RotateCcw className="size-4 mr-2" /> Restart Tutorial
            </Button>
            <p className="text-white/50 text-xs mt-6">This is an AI simulation. Actual results may vary based on adherence to routine.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Chapters UI */}
      <div className="absolute top-6 left-6 right-6 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {tutorial.steps.map((step, idx) => (
          <button
            key={step.id}
            onClick={() => jumpToStep(idx)}
            className={`h-2 flex-1 rounded-full transition-all duration-300 ${idx < currentStepIdx || showEndSlate ? 'bg-primary' : idx === currentStepIdx ? 'bg-primary/50' : 'bg-white/20'}`}
          />
        ))}
      </div>

      {/* Main Overlay UI Controls */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="flex justify-between items-start pointer-events-auto mt-6">
          <div className="bg-black/60 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20">
            <h3 className="text-white font-medium text-sm flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" />
              {showEndSlate ? "Simulation Complete" : `Step ${currentStepIdx + 1} of ${tutorial.steps.length}`}
            </h3>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full bg-black/40 backdrop-blur-md" onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full bg-black/40 backdrop-blur-md" onClick={() => setSpeed(s => s === 1 ? 1.5 : s === 1.5 ? 2 : 1)}>
              <span className="text-xs font-bold">{speed}x</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-30 p-8 bg-gradient-to-t from-black via-black/80 to-transparent">
        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-6 relative cursor-pointer">
          <div 
            className="absolute top-0 left-0 h-full bg-primary transition-all ease-linear shadow-[0_0_10px_rgba(var(--primary),0.8)]"
            style={{ width: `${overallProgressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button 
              variant="default" 
              size="icon" 
              className="rounded-full w-14 h-14 bg-white text-black hover:bg-white/90 shadow-xl"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="size-6 text-black" /> : showEndSlate ? <RotateCcw className="size-6 text-black" /> : <Play className="size-6 text-black ml-1" />}
            </Button>
            <div className="text-white">
              <p className="text-lg font-semibold tracking-wide drop-shadow-md">{showEndSlate ? "AI Results Prediction" : currentStep?.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full bg-black/40 backdrop-blur-md" onClick={toggleFullscreen}>
              <Maximize className="size-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
