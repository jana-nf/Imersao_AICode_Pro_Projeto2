"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  PROGRESS_CAP_PERCENTAGE,
  PROGRESS_UPDATE_INTERVAL_MS,
} from "@/lib/constants";
import { estimateAssemblyAITime } from "@/lib/processing-time-estimator";

interface CompactProgressProps {
  jobStatus: Doc<"projects">["jobStatus"];
  fileDuration?: number;
  createdAt: number;
}

export function CompactProgress({
  jobStatus,
  fileDuration,
  createdAt,
}: CompactProgressProps) {
  const [progress, setProgress] = useState(0);

  const isTranscribing = jobStatus?.transcription === "running";
  const isGenerating = jobStatus?.contentGeneration === "running";
  const isContentComplete = jobStatus?.contentGeneration === "completed";
  const isTranscriptComplete = jobStatus?.transcription === "completed";

  useEffect(() => {
    // If content generation is complete, show 100%
    if (isContentComplete) {
      setProgress(100);
      return;
    }
    
    // If transcription is complete but content is running, show 50-99%
    if (isTranscriptComplete && isGenerating) {
      setProgress(75);
      return;
    }
    
    // If not transcribing, calculate based on status
    if (!isTranscribing) {
      const baseProgress = isTranscriptComplete ? 50 : 0;
      setProgress(baseProgress);
      return;
    }

    // Tutorial: Calculate progress based on elapsed time vs estimated completion time
    const updateProgress = () => {
      const estimate = estimateAssemblyAITime(fileDuration);
      const elapsed = Math.floor((Date.now() - createdAt) / 1000);
      const calculatedProgress = (elapsed / estimate.conservative) * 100;
      setProgress(Math.min(PROGRESS_CAP_PERCENTAGE, calculatedProgress));
    };

    updateProgress();
    const interval = setInterval(updateProgress, PROGRESS_UPDATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isTranscribing, isGenerating, isContentComplete, isTranscriptComplete, createdAt, fileDuration]);

  const statusText = isTranscribing
    ? "🎙️ Transcribing..."
    : "✨ Generating content...";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Badge className="text-xs font-semibold bg-emerald-100 text-emerald-700 border-emerald-200">
          {statusText}
        </Badge>
        <span className="text-xs font-bold text-emerald-600">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="relative h-2 bg-emerald-100 rounded-full overflow-hidden">
        <div 
          className="absolute inset-y-0 left-0 progress-emerald rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
