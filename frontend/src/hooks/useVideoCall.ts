import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_ORIGIN } from '../lib/api';

export function useVideoCall(roomId: string, userName: string) {
  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    const socket = io(API_ORIGIN);
    socketRef.current = socket;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    pcRef.current = pc;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      })
      .catch((err) => console.error('Could not access camera/microphone', err));

    pc.ontrack = (event) => setRemoteStream(event.streams[0]);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { candidate: event.candidate, to: roomId });
      }
    };

    socket.emit('join-room', { roomId, userName });

    socket.on('offer', async ({ offer, from }) => {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { answer, to: from });
      setConnected(true);
    });

    socket.on('answer', async ({ answer }) => {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      setConnected(true);
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Error adding ICE candidate', err);
      }
    });

    socket.on('user-joined', async ({ socketId }) => {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('offer', { offer, to: socketId, roomId });
    });

    return () => {
      pc.close();
      socket.disconnect();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [roomId, userName]);

  const toggleAudio = (enabled: boolean) => {
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = enabled));
    socketRef.current?.emit('toggle-media', { roomId, audio: enabled });
  };

  const toggleVideo = (enabled: boolean) => {
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = enabled));
    socketRef.current?.emit('toggle-media', { roomId, video: enabled });
  };

  const endCall = () => {
    socketRef.current?.emit('end-call', { roomId });
  };

  return {
    localStream: localStreamRef.current,
    remoteStream,
    connected,
    toggleAudio,
    toggleVideo,
    endCall,
  };
}
