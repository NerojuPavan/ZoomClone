"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ICE_SERVERS } from "@/lib/config";
import type { RemotePeer, RoomParticipant, SignalingMessage } from "@/types/meeting";

interface UseWebRTCOptions {
  localUserId: string | null;
  sendMessage: (message: SignalingMessage) => void;
  enabled?: boolean;
  onKicked?: (reason: string) => void;
  initialMicOn?: boolean;
  initialCameraOn?: boolean;
}

interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remotePeers: RemotePeer[];
  isCameraOn: boolean;
  isMicOn: boolean;
  isMediaReady: boolean;
  isHost: boolean;
  hostUserId: string | null;
  hostNotice: string | null;
  roomParticipants: RoomParticipant[];
  handleSignalingMessage: (message: SignalingMessage) => void;
  toggleCamera: () => void;
  toggleMicrophone: () => void;
  cleanup: () => void;
  mediaError: string | null;
}

export function useWebRTC({
  localUserId,
  sendMessage,
  enabled = true,
  onKicked,
  initialMicOn = true,
  initialCameraOn = true,
}: UseWebRTCOptions): UseWebRTCReturn {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remotePeers, setRemotePeers] = useState<RemotePeer[]>([]);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const isCameraOnRef = useRef(true);
  const isMicOnRef = useRef(true);
  const [isMediaReady, setIsMediaReady] = useState(false);
  const [roomParticipants, setRoomParticipants] = useState<RoomParticipant[]>([]);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [hostUserId, setHostUserId] = useState<string | null>(null);
  const [hostNotice, setHostNotice] = useState<string | null>(null);
  const onKickedRef = useRef(onKicked);

  useEffect(() => {
    onKickedRef.current = onKicked;
  }, [onKicked]);

  const isHost = Boolean(localUserId && hostUserId && localUserId === hostUserId);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const streamCleanupRef = useRef<Map<string, () => void>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const makingOfferRef = useRef<Set<string>>(new Set());
  const mediaReadyPromiseRef = useRef<Promise<MediaStream> | null>(null);
  const participantNamesRef = useRef<Map<string, string>>(new Map());
  const remoteMediaStatesRef = useRef<Map<string, { isCameraOn: boolean; isMicOn: boolean }>>(new Map());

  const syncRemotePeers = useCallback(() => {
    const peers: RemotePeer[] = [];

    for (const participant of participantNamesRef.current.entries()) {
      const [userId, displayName] = participant;
      const stream = remoteStreamsRef.current.get(userId) ?? null;
      const signaledState = remoteMediaStatesRef.current.get(userId);
      peers.push({
        userId,
        displayName,
        stream,
        isCameraOn: signaledState?.isCameraOn ?? false,
        isMicOn: signaledState?.isMicOn ?? false,
      });
    }

    setRemotePeers(peers);
  }, []);

  const watchStreamTracks = useCallback(
    (stream: MediaStream) => {
      const handleTrackChange = () => syncRemotePeers();

      for (const track of stream.getTracks()) {
        track.addEventListener("mute", handleTrackChange);
        track.addEventListener("unmute", handleTrackChange);
        track.addEventListener("ended", handleTrackChange);
      }

      stream.addEventListener("addtrack", handleTrackChange);
      stream.addEventListener("removetrack", handleTrackChange);

      return () => {
        for (const track of stream.getTracks()) {
          track.removeEventListener("mute", handleTrackChange);
          track.removeEventListener("unmute", handleTrackChange);
          track.removeEventListener("ended", handleTrackChange);
        }
        stream.removeEventListener("addtrack", handleTrackChange);
        stream.removeEventListener("removetrack", handleTrackChange);
      };
    },
    [syncRemotePeers],
  );

  const waitForLocalStream = useCallback(async (): Promise<MediaStream> => {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }
    if (mediaReadyPromiseRef.current) {
      return mediaReadyPromiseRef.current;
    }
    throw new Error("Local media not available");
  }, []);

  const flushPendingCandidates = useCallback(
    async (pc: RTCPeerConnection, remoteUserId: string) => {
      const pending = [...(pendingCandidatesRef.current.get(remoteUserId) ?? [])];
      pendingCandidatesRef.current.set(remoteUserId, []);
      for (const candidate of pending) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error("Failed to add pending ICE candidate", error);
        }
      }
    },
    [],
  );

  const removePeer = useCallback(
    (remoteUserId: string) => {
      const pc = peerConnectionsRef.current.get(remoteUserId);
      if (pc) {
        pc.ontrack = null;
        pc.onicecandidate = null;
        pc.close();
        peerConnectionsRef.current.delete(remoteUserId);
      }
      remoteStreamsRef.current.delete(remoteUserId);
      streamCleanupRef.current.get(remoteUserId)?.();
      streamCleanupRef.current.delete(remoteUserId);
      pendingCandidatesRef.current.delete(remoteUserId);
      makingOfferRef.current.delete(remoteUserId);
      participantNamesRef.current.delete(remoteUserId);
      remoteMediaStatesRef.current.delete(remoteUserId);
      syncRemotePeers();
    },
    [syncRemotePeers],
  );

  const cleanupAllPeers = useCallback(() => {
    for (const userId of [...peerConnectionsRef.current.keys()]) {
      removePeer(userId);
    }
    for (const cleanup of streamCleanupRef.current.values()) {
      cleanup();
    }
    streamCleanupRef.current.clear();
    setRemotePeers([]);
  }, [removePeer]);

  const stopLocalMedia = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    mediaReadyPromiseRef.current = null;
    setLocalStream(null);
    setIsMediaReady(false);
  }, []);

  const cleanup = useCallback(() => {
    cleanupAllPeers();
    stopLocalMedia();
    setRoomParticipants([]);
    participantNamesRef.current.clear();
    remoteMediaStatesRef.current.clear();
  }, [cleanupAllPeers, stopLocalMedia]);

  const attachLocalTracks = useCallback((pc: RTCPeerConnection) => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const senders = pc.getSenders();
    for (const track of stream.getTracks()) {
      const existing = senders.find((s) => s.track?.kind === track.kind);
      if (existing) {
        void existing.replaceTrack(track);
      } else {
        pc.addTrack(track, stream);
      }
    }
  }, []);

  const registerParticipant = useCallback(
    (participant: RoomParticipant) => {
      participantNamesRef.current.set(participant.user_id, participant.display_name);
      syncRemotePeers();
    },
    [syncRemotePeers],
  );

  const createPeerConnection = useCallback(
    (remoteUser: RoomParticipant): RTCPeerConnection => {
      const remoteUserId = remoteUser.user_id;
      registerParticipant(remoteUser);

      const existing = peerConnectionsRef.current.get(remoteUserId);
      if (existing) {
        existing.ontrack = null;
        existing.onicecandidate = null;
        existing.close();
      }

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peerConnectionsRef.current.set(remoteUserId, pc);
      attachLocalTracks(pc);

      pc.ontrack = (event) => {
        let stream = remoteStreamsRef.current.get(remoteUserId);
        if (!stream) {
          stream = event.streams[0] ?? new MediaStream();
          remoteStreamsRef.current.set(remoteUserId, stream);
          streamCleanupRef.current.get(remoteUserId)?.();
          streamCleanupRef.current.set(remoteUserId, watchStreamTracks(stream));
        }
        if (!stream.getTracks().some((t) => t.id === event.track.id)) {
          stream.addTrack(event.track);
        }
        syncRemotePeers();
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && localUserId) {
          sendMessage({
            type: "ice-candidate",
            target_user_id: remoteUserId,
            payload: { candidate: event.candidate.toJSON() },
          });
        }
      };

      return pc;
    },
    [attachLocalTracks, localUserId, registerParticipant, sendMessage, syncRemotePeers, watchStreamTracks],
  );

  const createAndSendOffer = useCallback(
    async (remoteUser: RoomParticipant) => {
      if (!localUserId || makingOfferRef.current.has(remoteUser.user_id)) return;

      makingOfferRef.current.add(remoteUser.user_id);
      try {
        await waitForLocalStream();
        const pc = createPeerConnection(remoteUser);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        sendMessage({
          type: "offer",
          target_user_id: remoteUser.user_id,
          payload: { sdp: offer },
        });
      } catch (error) {
        console.error("Failed to create offer", error);
        removePeer(remoteUser.user_id);
      } finally {
        makingOfferRef.current.delete(remoteUser.user_id);
      }
    },
    [createPeerConnection, localUserId, removePeer, sendMessage, waitForLocalStream],
  );

  const setCameraEnabled = useCallback((enabled: boolean) => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = enabled;
      setIsCameraOn(enabled);
      isCameraOnRef.current = enabled;
    }
  }, []);

  const setMicrophoneEnabled = useCallback((enabled: boolean) => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = enabled;
      setIsMicOn(enabled);
      isMicOnRef.current = enabled;
    }
  }, []);

  const handleSignalingMessage = useCallback(
    async (message: SignalingMessage) => {
      if (!localUserId) return;

      switch (message.type) {
        case "room-state": {
          const participants = (message.payload.participants as RoomParticipant[]) ?? [];
          const hostId = message.payload.host_user_id as string | undefined;
          if (hostId) setHostUserId(hostId);
          setRoomParticipants(participants);
          for (const participant of participants) {
            registerParticipant(participant);
          }
          for (const participant of participants) {
            await createAndSendOffer(participant);
          }
          sendMessage({
            type: "media-state",
            payload: {
              isCameraOn: isCameraOnRef.current,
              isMicOn: isMicOnRef.current,
            },
          });
          break;
        }
        case "user-joined": {
          const joined = message.payload as unknown as RoomParticipant;
          setRoomParticipants((prev) => {
            if (prev.some((p) => p.user_id === joined.user_id)) return prev;
            return [...prev, joined];
          });
          registerParticipant(joined);
          sendMessage({
            type: "media-state",
            payload: {
              isCameraOn: isCameraOnRef.current,
              isMicOn: isMicOnRef.current,
            },
          });
          break;
        }
        case "user-left": {
          const leftId = message.payload.user_id as string;
          setRoomParticipants((prev) => prev.filter((p) => p.user_id !== leftId));
          removePeer(leftId);
          break;
        }
        case "offer": {
          if (!message.user_id) return;
          await waitForLocalStream();
          const remoteUser: RoomParticipant = {
            user_id: message.user_id,
            display_name: (message.payload.display_name as string) ?? "Participant",
          };
          const pc = createPeerConnection(remoteUser);
          const offer = message.payload.sdp as RTCSessionDescriptionInit;
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          await flushPendingCandidates(pc, remoteUser.user_id);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          sendMessage({
            type: "answer",
            target_user_id: remoteUser.user_id,
            payload: { sdp: answer },
          });
          break;
        }
        case "answer": {
          if (!message.user_id) return;
          const pc = peerConnectionsRef.current.get(message.user_id);
          if (!pc) return;
          const answer = message.payload.sdp as RTCSessionDescriptionInit;
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          await flushPendingCandidates(pc, message.user_id);
          break;
        }
        case "ice-candidate": {
          if (!message.user_id) return;
          const pc = peerConnectionsRef.current.get(message.user_id);
          if (!pc || !message.payload.candidate) return;
          const candidate = message.payload.candidate as RTCIceCandidateInit;
          if (!pc.remoteDescription) {
            const pending = pendingCandidatesRef.current.get(message.user_id) ?? [];
            pending.push(candidate);
            pendingCandidatesRef.current.set(message.user_id, pending);
            return;
          }
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (error) {
            console.error("Failed to add ICE candidate", error);
          }
          break;
        }
        case "host-mute": {
          setMicrophoneEnabled(false);
          setHostNotice("The host muted your microphone");
          sendMessage({
            type: "media-state",
            payload: {
              isCameraOn: isCameraOnRef.current,
              isMicOn: false,
            },
          });
          break;
        }
        case "host-video-off": {
          setCameraEnabled(false);
          setHostNotice("The host turned off your camera");
          sendMessage({
            type: "media-state",
            payload: {
              isCameraOn: false,
              isMicOn: isMicOnRef.current,
            },
          });
          break;
        }
        case "kicked": {
          const reason =
            (message.payload.reason as string) ?? "You were removed from the meeting";
          onKickedRef.current?.(reason);
          break;
        }
        case "host-changed": {
          const newHostId = message.payload.host_user_id as string;
          setHostUserId(newHostId);
          if (newHostId === localUserId) {
            setHostNotice("You are now the meeting host");
          }
          break;
        }
        case "media-state": {
          if (!message.user_id) return;
          const cameraOn = message.payload.isCameraOn as boolean;
          const micOn = message.payload.isMicOn as boolean;
          remoteMediaStatesRef.current.set(message.user_id, {
            isCameraOn: cameraOn,
            isMicOn: micOn,
          });
          syncRemotePeers();
          break;
        }
        case "error": {
          console.error("Signaling error:", message.payload.message);
          break;
        }
        default:
          break;
      }
    },
    [
      createAndSendOffer,
      createPeerConnection,
      flushPendingCandidates,
      localUserId,
      registerParticipant,
      removePeer,
      sendMessage,
      setCameraEnabled,
      setMicrophoneEnabled,
      syncRemotePeers,
      waitForLocalStream,
    ],
  );

  const broadcastMediaState = useCallback(
    (cameraOn: boolean, micOn: boolean) => {
      sendMessage({
        type: "media-state",
        payload: { isCameraOn: cameraOn, isMicOn: micOn },
      });
    },
    [sendMessage],
  );

  const toggleCamera = useCallback(() => {
    const newCameraOn = !isCameraOn;
    setCameraEnabled(newCameraOn);
    broadcastMediaState(newCameraOn, isMicOn);
    setHostNotice(null);
  }, [broadcastMediaState, isCameraOn, isMicOn, setCameraEnabled]);

  const toggleMicrophone = useCallback(() => {
    const newMicOn = !isMicOn;
    setMicrophoneEnabled(newMicOn);
    broadcastMediaState(isCameraOn, newMicOn);
    setHostNotice(null);
  }, [broadcastMediaState, isCameraOn, isMicOn, setMicrophoneEnabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    const promise = navigator.mediaDevices
      .getUserMedia({
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
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          throw new Error("Media init cancelled");
        }
        localStreamRef.current = stream;
        const audioTrack = stream.getAudioTracks()[0];
        const videoTrack = stream.getVideoTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = initialMicOn;
          setIsMicOn(initialMicOn);
          isMicOnRef.current = initialMicOn;
        }
        if (videoTrack) {
          videoTrack.enabled = initialCameraOn;
          setIsCameraOn(initialCameraOn);
          isCameraOnRef.current = initialCameraOn;
        }
        setLocalStream(stream);
        setIsMediaReady(true);
        setMediaError(null);
        return stream;
      })
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : "Failed to access camera/microphone";
        setMediaError(message);
        setIsMediaReady(false);
        throw error;
      });

    mediaReadyPromiseRef.current = promise;

    return () => {
      cancelled = true;
    };
  }, [enabled, initialCameraOn, initialMicOn]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
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
    cleanup,
    mediaError,
  };
}
