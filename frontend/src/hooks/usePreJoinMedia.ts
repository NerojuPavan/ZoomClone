"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UsePreJoinMediaReturn {
  stream: MediaStream | null;
  isCameraOn: boolean;
  isMicOn: boolean;
  isReady: boolean;
  error: string | null;
  toggleCamera: () => void;
  toggleMicrophone: () => void;
  stop: () => void;
}

export function usePreJoinMedia(enabled: boolean): UsePreJoinMediaReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    setIsReady(false);
  }, []);

  const toggleCamera = useCallback(() => {
    const current = streamRef.current;
    if (!current) return;
    const track = current.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsCameraOn(track.enabled);
    }
  }, []);

  const toggleMicrophone = useCallback(() => {
    const current = streamRef.current;
    if (!current) return;
    const track = current.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsMicOn(track.enabled);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      stop();
      return;
    }

    let cancelled = false;

    async function init() {
      try {
        const media = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        if (cancelled) {
          media.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = media;
        setStream(media);
        setIsReady(true);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to access camera/microphone",
          );
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      stop();
    };
  }, [enabled, stop]);

  return {
    stream,
    isCameraOn,
    isMicOn,
    isReady,
    error,
    toggleCamera,
    toggleMicrophone,
    stop,
  };
}
