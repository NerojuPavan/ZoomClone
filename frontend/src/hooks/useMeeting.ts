"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { WS_BASE_URL } from "@/lib/config";
import { meetingApi } from "@/services/meeting-api";
import {
  clearMeetingSession,
  getMeetingSession,
  setMeetingSession,
  type MeetingSession,
} from "@/store/meeting-session";
import { getPostMeetingRedirectPath } from "@/store/auth-storage";
import type { JoinPreferences, Meeting, RemotePeer } from "@/types/meeting";

import { useWebRTC } from "./useWebRTC";
import { useWebSocket } from "./useWebSocket";

interface UseMeetingOptions {
  meetingId: string;
}

interface UseMeetingReturn {
  meeting: Meeting | null;
  session: MeetingSession | null;
  isLoading: boolean;
  error: string | null;
  isJoined: boolean;
  isConnected: boolean;
  isHost: boolean;
  hostUserId: string | null;
  hostNotice: string | null;
  joinMeeting: (prefs: JoinPreferences) => Promise<void>;
  leaveMeeting: () => Promise<void>;
  kickParticipant: (targetUserId: string) => void;
  muteParticipant: (targetUserId: string) => void;
  muteAllParticipants: () => void;
  disableParticipantVideo: (targetUserId: string) => void;
  localStream: MediaStream | null;
  remotePeers: RemotePeer[];
  isCameraOn: boolean;
  isMicOn: boolean;
  toggleCamera: () => void;
  toggleMicrophone: () => void;
  mediaError: string | null;
  isMediaReady: boolean;
  participants: { user_id: string; display_name: string }[];
}

export function useMeeting({ meetingId }: UseMeetingOptions): UseMeetingReturn {
  const router = useRouter();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [session, setSession] = useState<MeetingSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kickReason, setKickReason] = useState<string | null>(null);

  const isJoined = Boolean(session);
  const sendMessageRef = useRef<(message: Parameters<ReturnType<typeof useWebSocket>["sendMessage"]>[0]) => void>(() => {});
  const joinMediaPrefsRef = useRef({ micOn: true, cameraOn: true });

  const handleKicked = useCallback(
    (reason: string) => {
      setKickReason(reason);
    },
    [],
  );

  const {
    localStream,
    remotePeers,
    isCameraOn,
    isMicOn,
    isMediaReady,
    isHost,
    hostUserId,
    hostNotice,
    roomParticipants,
    handleSignalingMessage,
    toggleCamera,
    toggleMicrophone,
    cleanup: cleanupWebRTC,
    mediaError,
  } = useWebRTC({
    localUserId: session?.sessionUserId ?? null,
    sendMessage: (message) => sendMessageRef.current(message),
    enabled: isJoined,
    onKicked: handleKicked,
    initialMicOn: joinMediaPrefsRef.current.micOn,
    initialCameraOn: joinMediaPrefsRef.current.cameraOn,
  });

  const wsUrl = useMemo(() => {
    if (!session) return null;
    const params = new URLSearchParams({
      user_id: session.sessionUserId,
      display_name: session.displayName,
    });
    return `${WS_BASE_URL}/ws/${meetingId}?${params.toString()}`;
  }, [meetingId, session]);

  const { isConnected, sendMessage, disconnect } = useWebSocket({
    url: wsUrl,
    enabled: isJoined && isMediaReady,
    onMessage: handleSignalingMessage,
  });

  sendMessageRef.current = sendMessage;

  const kickParticipant = useCallback(
    (targetUserId: string) => {
      sendMessage({
        type: "host-kick",
        target_user_id: targetUserId,
        payload: {},
      });
    },
    [sendMessage],
  );

  const muteParticipant = useCallback(
    (targetUserId: string) => {
      sendMessage({
        type: "host-mute",
        target_user_id: targetUserId,
        payload: {},
      });
    },
    [sendMessage],
  );

  const disableParticipantVideo = useCallback(
    (targetUserId: string) => {
      sendMessage({
        type: "host-video-off",
        target_user_id: targetUserId,
        payload: {},
      });
    },
    [sendMessage],
  );

  const muteAllParticipants = useCallback(() => {
    for (const participant of roomParticipants) {
      sendMessage({
        type: "host-mute",
        target_user_id: participant.user_id,
        payload: {},
      });
    }
  }, [roomParticipants, sendMessage]);

  useEffect(() => {
    let cancelled = false;

    async function loadMeeting() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await meetingApi.getMeeting(meetingId);
        if (!cancelled) {
          setMeeting(data);
          const existing = getMeetingSession(meetingId);
          if (existing) {
            setSession(existing);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load meeting");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadMeeting();
    return () => {
      cancelled = true;
    };
  }, [meetingId]);

  const joinMeeting = useCallback(
    async (prefs: JoinPreferences) => {
      setError(null);
      joinMediaPrefsRef.current = {
        micOn: prefs.micOn,
        cameraOn: prefs.cameraOn,
      };
      try {
        const response = await meetingApi.joinMeeting(meetingId, prefs.displayName);
        const newSession: MeetingSession = {
          meetingId,
          sessionUserId: response.session_user_id,
          participantId: response.participant_id,
          displayName: prefs.displayName.trim(),
        };
        setMeetingSession(newSession);
        setSession(newSession);
        setMeeting(response.meeting);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to join meeting");
        throw err;
      }
    },
    [meetingId],
  );

  const leaveMeeting = useCallback(async () => {
    if (session) {
      try {
        await meetingApi.leaveMeeting(meetingId, session.sessionUserId);
      } catch {
        // Best-effort leave on navigation
      }
      clearMeetingSession(meetingId);
    }
    disconnect();
    cleanupWebRTC();
    setSession(null);
    router.push(getPostMeetingRedirectPath());
  }, [cleanupWebRTC, disconnect, meetingId, router, session]);

  useEffect(() => {
    if (!kickReason) return;

    const timeout = setTimeout(() => {
      void leaveMeeting();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [kickReason, leaveMeeting]);

  return {
    meeting,
    session,
    isLoading,
    error: kickReason ?? error,
    isJoined,
    isConnected,
    isHost,
    hostUserId,
    hostNotice,
    joinMeeting,
    leaveMeeting,
    kickParticipant,
    muteParticipant,
    muteAllParticipants,
    disableParticipantVideo,
    localStream,
    remotePeers,
    isCameraOn,
    isMicOn,
    toggleCamera,
    toggleMicrophone,
    mediaError,
    isMediaReady,
    participants: roomParticipants,
  };
}
