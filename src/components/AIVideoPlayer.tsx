export type SubtitlesMap = {
  en?: string;
  es?: string;
  fr?: string;
  hi?: string;
  de?: string;
  ja?: string;
  ko?: string;
  zh?: string;
  pt?: string;
  it?: string;
  ar?: string;
};

export type TutorialStep = {
  id?: string;
  stepNumber: number;
  title: string;
  description?: string;
  narration?: string;
  durationSeconds?: number;
  durationSec?: number;
  productType?: string;
  technique?: string;
  avoidMistake?: string;
  proTip?: string;
  subtitles?: SubtitlesMap;
  product?: Product;
};

export type TutorialData = {
  id?: string;
  title: string;
  kind?: string;
  category?: string;
  level?: string;
  duration: string;
  thumbnail?: string;
  description?: string;
  targetSkinTypes?: string[];
  targetConcerns?: string[];
  steps: TutorialStep[];
};

export function AIVideoPlayer({ 
  tutorial,
  selectedLanguage = "en",
  onStepChange
}: { 
  tutorial: TutorialData;
  selectedLanguage?: string;
  onStepChange?: (stepIdx: number) => void;
}) {
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

  // Web Speech API Voice Narration Engine
  useEffect(() => {
    if (!isPlaying || isMuted || showEndSlate || !currentStep) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Clear queued audio
      
      const textToSpeak = currentStep.subtitles?.[selectedLanguage as keyof SubtitlesMap] || currentStep.narration || currentStep.technique || currentStep.title;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      
      // Match voice language code
      const langCodes: Record<string, string> = {
        en: "en-US", es: "es-ES", fr: "fr-FR", hi: "hi-IN", de: "de-DE",
        ja: "ja-JP", ko: "ko-KR", zh: "zh-CN", pt: "pt-BR", it: "it-IT", ar: "ar-SA"
      };
      utterance.lang = langCodes[selectedLanguage] || "en-US";
      utterance.rate = speed;

      window.speechSynthesis.speak(utterance);
    }
  }, [isPlaying, currentStepIdx, selectedLanguage, isMuted, speed, showEndSlate]);

  // Playback engine
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && currentStep && !showEndSlate) {
      const durationSec = currentStep.durationSeconds || currentStep.durationSec || 45;
      const stepDurationMs = (durationSec * 1000) / speed;
      const tickRate = 50; 
      const increment = (tickRate / stepDurationMs) * 100;

      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev + increment >= 100) {
            if (currentStepIdx < tutorial.steps.length - 1) {
              const nextIdx = currentStepIdx + 1;
              setCurrentStepIdx(nextIdx);
              if (onStepChange) onStepChange(nextIdx);
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
      
      if (videoRef.current) videoRef.current.play().catch(() => {});
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
      if (onStepChange) onStepChange(0);
    }
    setIsPlaying(!isPlaying);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const jumpToStep = (idx: number) => {
    setCurrentStepIdx(idx);
    setProgress(0);
    setShowEndSlate(false);
    setIsPlaying(true);
    if (onStepChange) onStepChange(idx);
  };

  const totalDuration = tutorial.steps.reduce((acc, step) => acc + (step.durationSeconds || step.durationSec || 45), 0);
  const elapsedBeforeCurrent = tutorial.steps.slice(0, currentStepIdx).reduce((acc, step) => acc + (step.durationSeconds || step.durationSec || 45), 0);
  const currentStepDurationSec = currentStep ? (currentStep.durationSeconds || currentStep.durationSec || 45) : 45;
  const currentElapsed = currentStep && !showEndSlate ? (progress / 100) * currentStepDurationSec : 0;
  const overallProgressPercent = showEndSlate ? 100 : ((elapsedBeforeCurrent + currentElapsed) / totalDuration) * 100;

  // Active Subtitle Line based on language selection
  const activeSubtitle = currentStep?.subtitles?.[selectedLanguage as keyof SubtitlesMap] 
    || currentStep?.narration 
    || currentStep?.technique 
    || currentStep?.description 
    || "Welcome to your AI personalized video tutorial.";

  return (
    <div ref={containerRef} className="relative w-full aspect-video bg-slate-950 rounded-3xl overflow-hidden shadow-2xl group flex flex-col font-sans border border-white/10">
      
      {/* Background Video Loop with Ambient Glow */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          src="https://cdn.pixabay.com/video/2021/08/25/86271-593674686_large.mp4" 
          loop
          muted={true}
          playsInline
          className={`w-full h-full object-cover transition-all duration-1000 ${showEndSlate ? 'blur-xl opacity-20' : 'opacity-85'}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/40" />
      </div>

      {/* Live AI Selected Product Showcase */}
      <AnimatePresence>
        {(currentStep?.product || currentStep?.productType) && isPlaying && !showEndSlate && (
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            className="absolute top-6 right-6 w-56 sm:w-72 bg-slate-900/80 backdrop-blur-2xl border border-white/15 rounded-2xl p-4 shadow-2xl z-20"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="size-4 text-amber-400 animate-pulse" />
              <span className="text-[11px] font-semibold tracking-wider text-amber-300 uppercase">Dermatologist Choice</span>
            </div>
            {currentStep.product?.image ? (
              <img src={currentStep.product.image} alt={currentStep.product.name} className="w-full h-24 object-cover rounded-lg mb-2 border border-white/10" />
            ) : null}
            <h4 className="text-xs font-semibold text-white leading-tight mb-1">{currentStep.product?.name || currentStep.productType}</h4>
            <p className="text-[11px] text-white/70 line-clamp-2">{currentStep.technique}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtitles Overlay */}
      <div className="absolute bottom-24 left-0 right-0 px-8 z-20 flex flex-col items-center pointer-events-none">
        <AnimatePresence mode="wait">
          {!showEndSlate && (
            <motion.div
              key={`${currentStepIdx}-${selectedLanguage}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-slate-900/90 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/15 shadow-2xl max-w-2xl text-center"
            >
              <p className="text-white text-base sm:text-lg font-medium drop-shadow-md leading-snug">
                {activeSubtitle}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* End Slate Simulation */}
      <AnimatePresence>
        {showEndSlate && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md text-white text-center"
          >
            <TrendingUp className="size-14 text-emerald-400 mb-4 animate-bounce" />
            <h2 className="text-2xl sm:text-3xl font-display font-medium mb-3">Tutorial Complete! 🎉</h2>
            <p className="text-sm text-white/70 max-w-md mb-6">
              You have completed all {tutorial.steps.length} steps in {tutorial.title}. Consistent application yields radiant barrier repair.
            </p>
            
            <Button size="lg" className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold" onClick={togglePlay}>
              <RotateCcw className="size-4 mr-2" /> Replay Video Tutorial
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step Indicator Progress Bar */}
      <div className="absolute top-4 left-4 right-4 z-30 flex gap-1.5 opacity-90">
        {tutorial.steps.map((step, idx) => (
          <button
            key={idx}
            onClick={() => jumpToStep(idx)}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${idx < currentStepIdx || showEndSlate ? 'bg-amber-400' : idx === currentStepIdx ? 'bg-amber-400/60' : 'bg-white/20'}`}
          />
        ))}
      </div>

      {/* Top Header Overlay Controls */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="flex justify-between items-center pointer-events-auto mt-4">
          <div className="bg-slate-900/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
            <h3 className="text-white font-medium text-xs flex items-center gap-2">
              <CheckCircle2 className="size-3.5 text-amber-400" />
              {showEndSlate ? "Completed" : `Step ${currentStepIdx + 1} of ${tutorial.steps.length}: ${currentStep?.title}`}
            </h3>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full bg-slate-900/60 backdrop-blur-md size-9" onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full bg-slate-900/60 backdrop-blur-md size-9" onClick={() => setSpeed(s => s === 1 ? 1.25 : s === 1.25 ? 1.5 : 1)}>
              <span className="text-xs font-bold">{speed}x</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Scrubber & Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-30 p-6 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent">
        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden mb-4 relative cursor-pointer">
          <div 
            className="absolute top-0 left-0 h-full bg-amber-400 transition-all ease-linear"
            style={{ width: `${overallProgressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="default" 
              size="icon" 
              className="rounded-full size-11 bg-white text-slate-950 hover:bg-white/90 shadow-xl"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="size-5 text-slate-950" /> : showEndSlate ? <RotateCcw className="size-5 text-slate-950" /> : <Play className="size-5 text-slate-950 ml-0.5" />}
            </Button>
            <div className="text-white">
              <p className="text-sm font-semibold tracking-wide">{showEndSlate ? "Tutorial Complete" : currentStep?.title}</p>
              <p className="text-xs text-white/70">{currentStep?.productType || "Step Walkthrough"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full bg-slate-900/60 backdrop-blur-md size-9" onClick={toggleFullscreen}>
              <Maximize className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
