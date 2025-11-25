import { useEffect, useRef, useState, useCallback } from "react";
import { Audio } from "expo-av";

export function useAudioPreview() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const loadIdRef = useRef(0);
  const mountedRef = useRef(true);

  const [playing, setPlaying] = useState(false);
  const [active, setActive] = useState(true);

  const stopAll = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync().catch(() => {});
        await soundRef.current.unloadAsync().catch(() => {});
      }
    } finally {
      soundRef.current = null;
    }
  }, []);

  const playPreview = useCallback(
    async (url: string | null) => {
      if (!mountedRef.current || !url || !active) return;
      const myLoadId = ++loadIdRef.current;

      await stopAll();

      if (myLoadId !== loadIdRef.current) return;

      try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: false }
      );

      if (myLoadId !== loadIdRef.current) {
        await sound.unloadAsync().catch(() => {});
        return;
      }

      soundRef.current = sound;

      if (active) {
        setPlaying(true); // ensure play state is true
        await soundRef.current.playAsync().catch(() => {});
      }
      } catch (e) {
        console.warn("Preview load error", e);
      }
    },
    [active, stopAll]
  );


  // React to play/pause changes
  useEffect(() => {
    if (!soundRef.current) return;
    if (!active) {
      stopAll();
      return;
    }

    if (playing) {
      soundRef.current.playAsync().catch(() => {});
    } else {
      soundRef.current.pauseAsync().catch(() => {});
    }
  }, [playing, active, stopAll]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopAll();
    };
  }, [stopAll]);

  return {
    playing,
    setPlaying,
    active,
    setActive,
    playPreview,
    stopAll,
  };
}
