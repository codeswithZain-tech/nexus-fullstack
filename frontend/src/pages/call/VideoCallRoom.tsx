import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useVideoCall } from '../../hooks/useVideoCall';

export const VideoCallRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { localStream, remoteStream, connected, toggleAudio, toggleVideo, endCall } = useVideoCall(
    roomId || '',
    user?.name || 'Guest'
  );

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  const handleEndCall = () => {
    endCall();
    navigate('/meetings');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <div className="flex-1 flex flex-col p-4 max-w-5xl mx-auto w-full">
        <p className="text-gray-400 text-sm mb-3">
          Room <span className="text-primary-400">{roomId}</span> ·{' '}
          {connected ? <span className="text-success-500">Connected</span> : <span>Waiting for the other participant…</span>}
        </p>

        <div className="relative flex-1 rounded-xl overflow-hidden bg-black">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute bottom-4 right-4 w-48 h-32 rounded-lg border-2 border-gray-700 object-cover"
          />
        </div>

        <div className="flex justify-center gap-4 mt-6 pb-2">
          <button
            onClick={() => {
              setAudioOn(!audioOn);
              toggleAudio(!audioOn);
            }}
            className={`p-4 rounded-full transition-colors ${audioOn ? 'bg-gray-700 text-white' : 'bg-error-600 text-white'}`}
            aria-label="Toggle microphone"
          >
            {audioOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          <button
            onClick={() => {
              setVideoOn(!videoOn);
              toggleVideo(!videoOn);
            }}
            className={`p-4 rounded-full transition-colors ${videoOn ? 'bg-gray-700 text-white' : 'bg-error-600 text-white'}`}
            aria-label="Toggle camera"
          >
            {videoOn ? <Video size={20} /> : <VideoOff size={20} />}
          </button>

          <button
            onClick={handleEndCall}
            className="p-4 rounded-full bg-error-600 hover:bg-error-700 text-white"
            aria-label="End call"
          >
            <PhoneOff size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
