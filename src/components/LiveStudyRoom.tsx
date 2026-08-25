import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  ScreenShare,
  Hand,
  MessageSquare,
  Sparkles,
  Award,
  CheckCircle2,
  Clock,
  Volume2,
  Smile,
  ShieldCheck,
  Send,
  HelpCircle,
  Flame,
  Star,
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudyRoomSession, WhiteboardElement, UserProfile } from '../types';
import { Whiteboard } from './Whiteboard';

interface LiveStudyRoomProps {
  session: StudyRoomSession;
  currentUser: UserProfile;
  onEndSession: (stats: { rating: number; review: string; bonusCoins: number }) => void;
  onLeaveRoom: () => void;
  onOpenSocraticHint?: () => void;
}

export const LiveStudyRoom: React.FC<LiveStudyRoomProps> = ({
  session,
  currentUser,
  onEndSession,
  onLeaveRoom,
  onOpenSocraticHint,
}) => {
  // Media State
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isHandRaised, setIsHandRaised] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'whiteboard' | 'chat' | 'checklist'>('whiteboard');
  const [sessionEndedReason, setSessionEndedReason] = useState<'mentor_left' | 'student_completed' | null>(null);

  const isCurrentUserMentor = currentUser.id === session.mentor.id;

  // Real WebRTC / MediaStream state
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // Chat & Notes
  const [chatMessages, setChatMessages] = useState(session.messages || []);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Floating Reactions
  const [floatingReactions, setFloatingReactions] = useState<{ id: string; emoji: string; x: number }[]>([]);

  // Session Duration Timer
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Whiteboard state
  const [whiteboardElements, setWhiteboardElements] = useState<WhiteboardElement[]>(session.sharedWhiteboard || []);

  // Completion Dialog
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [mentorRating, setMentorRating] = useState<number>(5);
  const [reviewNote, setReviewNote] = useState<string>('Penjelasan langkah demi langkah sangat jelas di papan tulis!');
  const [awardedBonus, setAwardedBonus] = useState<number>(10);

  // Step Checklist
  const [steps, setSteps] = useState([
    { id: 's1', text: 'Identifikasi variabel & data yang diketahui dari soal', done: true },
    { id: 's2', text: 'Gambarkan diagram fisis / turunan rumus dasar pada whiteboard', done: true },
    { id: 's3', text: 'Eksekusi kalkulasi analitis langkah demi langkah', done: false },
    { id: 's4', text: 'Verifikasi hasil akhir dan satuan dimensi', done: false },
  ]);

  // Audio level simulation for voice activity
  const [mentorAudioLevel, setMentorAudioLevel] = useState<number>(45);
  const [studentAudioLevel, setStudentAudioLevel] = useState<number>(20);

  // WebRTC & Pusher State
  const [pusherChannel, setPusherChannel] = useState<any>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  // Timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Set up Pusher and WebRTC
  useEffect(() => {
    if (session.status === 'pending') return; // Don't connect until active

    const initWebRTC = async () => {
      import('../lib/pusherClient').then(({ getPusherClient }) => {
        const pusher = getPusherClient();
        const channelName = `presence-room-${session.id}`;
        
        pusher.unsubscribe(channelName);
        const channel = pusher.subscribe(channelName);
        setPusherChannel(channel);

        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        peerConnectionRef.current = pc;

        // Add any existing tracks immediately if setupCamera finished before initWebRTC
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => {
            pc.addTrack(track, localStreamRef.current!);
          });
        }

        // Helper to trigger events via server API (bypasses Pusher client events limitation)
        const triggerEvent = async (eventName: string, eventData: any) => {
          const socketId = pusher.connection.socket_id;
          await fetch('/api/pusher/trigger', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              channel: channelName,
              event: eventName,
              data: eventData,
              socket_id: socketId
            })
          });
        };

        // Listen for remote tracks and aggregate them into a single continuous MediaStream
        pc.ontrack = (event) => {
          if (!remoteStreamRef.current) {
            remoteStreamRef.current = new MediaStream();
          }
          remoteStreamRef.current.addTrack(event.track);

          if (remoteVideoRef.current) {
            if (remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
              remoteVideoRef.current.srcObject = remoteStreamRef.current;
            }
            remoteVideoRef.current.play().catch(e => console.warn("Remote play failed", e));
          }
        };

        // ICE Candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            triggerEvent('room-webrtc-ice', { candidate: event.candidate, senderId: currentUser.id });
          }
        };

        // Perfect Negotiation State
        let makingOffer = false;
        let ignoreOffer = false;
        const isPolite = currentUser.id !== session.mentor.id; // Student yields to Mentor

        // Negotiation needed for dynamic tracks
        pc.onnegotiationneeded = async () => {
          try {
            makingOffer = true;
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            triggerEvent('room-webrtc-offer', { offer: pc.localDescription, senderId: currentUser.id });
          } catch (e) {
            console.error("Error creating offer on negotiation needed", e);
          } finally {
            makingOffer = false;
          }
        };

        channel.bind('pusher:subscription_succeeded', async (members: any) => {
          if (members.count > 1 && !isPolite) {
            try {
              makingOffer = true;
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              triggerEvent('room-webrtc-offer', { offer: pc.localDescription, senderId: currentUser.id });
            } catch (e) {
              console.error(e);
            } finally {
              makingOffer = false;
            }
          }
        });

        channel.bind('pusher:member_added', async (member: any) => {
          if (!isPolite) {
            try {
              makingOffer = true;
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              triggerEvent('room-webrtc-offer', { offer: pc.localDescription, senderId: currentUser.id });
            } catch (e) {
              console.error(e);
            } finally {
              makingOffer = false;
            }
          }
        });

        channel.bind('room-webrtc-offer', async (data: any) => {
          try {
            const offerCollision = (pc.signalingState !== "stable") || makingOffer;
            
            ignoreOffer = !isPolite && offerCollision;
            if (ignoreOffer) {
              return; // We are impolite and there is a collision. Ignore their offer.
            }

            if (offerCollision) {
              // We are polite and there's a collision. Rollback our local offer.
              await Promise.all([
                pc.setLocalDescription({ type: "rollback" }),
                pc.setRemoteDescription(new RTCSessionDescription(data.offer))
              ]);
            } else {
              await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            }

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            triggerEvent('room-webrtc-answer', { answer: pc.localDescription, senderId: currentUser.id });
          } catch (e) {
            console.error("Error handling offer", e);
          }
        });

        channel.bind('room-webrtc-answer', async (data: any) => {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          } catch (e) {
            console.error("Error handling answer", e);
          }
        });

        channel.bind('room-webrtc-ice', async (data: any) => {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (e) {
            if (!ignoreOffer) console.error("Error adding ICE candidate", e);
          }
        });

        channel.bind('room-chat-message', (data: any) => {
          setChatMessages((prev) => [...prev, data.message]);
        });

        channel.bind('room-mentor-left', () => {
          setSessionEndedReason('mentor_left');
        });

        channel.bind('room-student-completed', () => {
          setSessionEndedReason('student_completed');
        });
      });
    };

    initWebRTC();

    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      import('../lib/pusherClient').then(({ getPusherClient }) => {
        getPusherClient().unsubscribe(`presence-room-${session.id}`);
      });
    };
  }, [session.status, session.id, currentUser.id, session.mentor.id]);

  // Voice level oscillation simulation (keep for visual flair)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isMicOn) {
        setStudentAudioLevel(Math.floor(Math.random() * 60) + 20);
      } else {
        setStudentAudioLevel(0);
      }
      setMentorAudioLevel(Math.floor(Math.random() * 75) + 15);
    }, 500);
    return () => clearInterval(interval);
  }, [isMicOn]);

  // Handle Camera toggling & Local Media
  useEffect(() => {
    let stream: MediaStream | null = null;
    async function setupCamera() {
      if (isCameraOn || isMicOn) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: isCameraOn, audio: isMicOn });
          setLocalStream(stream);
          localStreamRef.current = stream;
          if (localVideoRef.current && isCameraOn) {
            localVideoRef.current.srcObject = stream;
          }
          setMediaError(null);
          
          // Replace track in peer connection if already active
          if (peerConnectionRef.current) {
            const senders = peerConnectionRef.current.getSenders();
            stream.getTracks().forEach(track => {
              const sender = senders.find(s => s.track?.kind === track.kind);
              if (sender) {
                sender.replaceTrack(track);
              } else {
                peerConnectionRef.current?.addTrack(track, stream!);
              }
            });
          }

        } catch (err: any) {
          console.warn('Media access not granted or unavailable:', err);
          setMediaError('Akses media tidak tersedia.');
        }
      } else {
        if (localStream) {
          localStream.getTracks().forEach((track) => track.stop());
          setLocalStream(null);
        }
      }
    }
    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isCameraOn, isMicOn]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      id: `msg_${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      text: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    
    // Broadcast message via server API
    if (pusherChannel) {
      const socketId = pusherChannel.pusher?.connection?.socket_id;
      fetch('/api/pusher/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: pusherChannel.name,
          event: 'room-chat-message',
          data: { message: newMsg },
          socket_id: socketId
        })
      }).catch(console.error);
    }

    setChatInput('');
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const triggerReaction = (emoji: string) => {
    const id = `react_${Date.now()}_${Math.random()}`;
    const x = Math.floor(Math.random() * 60) + 20; // 20% to 80% width
    setFloatingReactions((prev) => [...prev, { id, emoji, x }]);

    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2000);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleFinishRoom = () => {
    setShowCompletionModal(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleConfirmFinish = () => {
    if (pusherChannel) {
      const socketId = pusherChannel.pusher?.connection?.socket_id;
      fetch('/api/pusher/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: pusherChannel.name,
          event: 'room-student-completed',
          data: {},
          socket_id: socketId
        })
      }).catch(console.error);
    }
    onEndSession({
      rating: mentorRating,
      review: reviewNote,
      bonusCoins: awardedBonus,
    });
  };

  const handleMentorLeave = () => {
    if (pusherChannel) {
      const socketId = pusherChannel.pusher?.connection?.socket_id;
      fetch('/api/pusher/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: pusherChannel.name,
          event: 'room-mentor-left',
          data: {},
          socket_id: socketId
        })
      }).catch(console.error);
    }
    onLeaveRoom();
  };

  const toggleStep = (id: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s))
    );
  };

  return (
    <div id="live-study-room" className="h-[calc(100vh-4rem)] flex flex-col bg-[#F8FAFC] text-slate-900 overflow-hidden relative">
      {/* Floating Animated Reactions */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingReactions.map((r) => (
          <div
            key={r.id}
            style={{ left: `${r.x}%` }}
            className="absolute bottom-20 text-3xl animate-bounce duration-1000 transition-all transform -translate-y-64 opacity-0"
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Top Session Ribbon */}
      <div className="bg-white border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between gap-4 z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold text-emerald-700 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>SESI AKTIF LIVE</span>
          </div>

          <div className="hidden sm:flex flex-col">
            <h2 className="text-sm font-bold text-slate-900 truncate max-w-md">
              {session.title || 'Sesi Kolaborasi Tugas Bersama'}
            </h2>
            <span className="text-[11px] text-slate-500 flex items-center gap-2">
              <span className="bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded text-indigo-700 font-semibold">{session.subject}</span>
              <span>Bounty: <strong className="text-amber-600 font-bold">+{session.bountyCoins} TemanCoins</strong></span>
            </span>
          </div>
        </div>

        {/* Timer & Socratic Copilot Button */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg text-xs font-mono text-slate-800 font-semibold">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>

          {onOpenSocraticHint && (
            <button
              onClick={onOpenSocraticHint}
              className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition"
              title="Minta Bantuan Petunjuk Socratic AI"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Socratic AI Hint</span>
            </button>
          )}

          {!isCurrentUserMentor && (
            <button
              onClick={handleFinishRoom}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-xs transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Selesaikan Sesi</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Split Body: Whiteboard / Video Area & Side Panel */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left / Center Main Stage (Whiteboard + Video Overlays) */}
        <div className="flex-1 flex flex-col h-full bg-slate-100/60 relative p-3 overflow-hidden">
          {/* Main Interactive Whiteboard Stage */}
          <div className="flex-1 h-full min-h-0">
            <Whiteboard
              initialElements={whiteboardElements}
              onElementsChange={setWhiteboardElements}
              currentUser={{ id: currentUser.id, name: currentUser.name }}
              partnerName={currentUser.id === session.mentor.id ? session.student.name : session.mentor.name}
              roomTitle={`${session.subject}: ${session.title}`}
              presetFormula={session.targetEquation}
              pusherChannel={pusherChannel}
            />
          </div>

          {/* Floating Audio-Visual Participant Tiles (Top-Right of Canvas) */}
          <div className="absolute top-6 right-6 z-30 flex flex-col sm:flex-row gap-2.5 pointer-events-auto">
            {(() => {
              const partnerProfile = isCurrentUserMentor ? session.student : session.mentor;
              const partnerLabel = isCurrentUserMentor ? 'Siswa' : 'Mentor Rekan';
              const partnerRoleDesc = isCurrentUserMentor ? 'Pelajar' : 'Senior Peer Tutor';
              const partnerAudioLvl = mentorAudioLevel; // Simulated remote audio

              const myLabel = isCurrentUserMentor ? 'Anda (Mentor)' : 'Anda (Siswa)';
              const myRoleDesc = isCurrentUserMentor ? 'Senior Peer Tutor' : `Lvl ${currentUser.level} Scholar`;
              const myAudioLvl = studentAudioLevel; // Driven by local mic
              
              return (
                <>
                  {/* Partner Tile */}
                  <div className="w-44 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl p-2.5 shadow-xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                        {partnerLabel}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>24ms</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <video
                          ref={remoteVideoRef}
                          autoPlay
                          playsInline
                          className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500 shadow-xs absolute inset-0 z-10"
                        />
                        <img
                          src={partnerProfile.avatar}
                          alt={partnerProfile.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500 shadow-xs relative z-0"
                        />
                        {partnerAudioLvl > 30 && (
                          <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full ring-2 ring-white animate-pulse z-20">
                            <Volume2 className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{partnerProfile.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{partnerRoleDesc}</p>
                        {/* Waveform indicator */}
                        <div className="flex items-center gap-0.5 mt-1 h-2">
                          {[40, 70, 90, 60, 80].map((h, i) => (
                            <div
                              key={i}
                              style={{ height: `${(h * partnerAudioLvl) / 100}%` }}
                              className="w-1 bg-indigo-500 rounded-full transition-all duration-150"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* My Tile (Self) */}
                  <div className="w-44 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl p-2.5 shadow-xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                        {myLabel}
                      </span>
                      {isHandRaised && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 animate-bounce">
                          <Hand className="w-2.5 h-2.5" /> Tanya
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        {isCameraOn && localStream ? (
                          <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500 shadow-xs"
                          />
                        ) : (
                          <img
                            src={currentUser.avatar}
                            alt={currentUser.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-slate-300 shadow-xs"
                          />
                        )}
                        <div
                          className={`absolute -bottom-1 -right-1 p-0.5 rounded-full ring-2 ring-white ${isMicOn ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}
                        >
                          {isMicOn ? <Mic className="w-2.5 h-2.5" /> : <MicOff className="w-2.5 h-2.5" />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{myRoleDesc}</p>
                        {/* Waveform indicator */}
                        <div className="flex items-center gap-0.5 mt-1 h-2">
                          {[30, 50, 80, 40, 60].map((h, i) => (
                            <div
                              key={i}
                              style={{ height: isMicOn ? `${(h * myAudioLvl) / 100}%` : '2px' }}
                              className={`w-1 rounded-full transition-all duration-150 ${isMicOn ? 'bg-emerald-500' : 'bg-slate-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Right Sidebar: Chat, Equation Steps & Problem Spec */}
        <div className="w-full lg:w-80 bg-white border-l border-slate-200/80 flex flex-col h-72 lg:h-full z-20">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('whiteboard')}
              className={`flex-1 py-3 px-3 border-b-2 text-center transition ${activeTab === 'whiteboard' ? 'border-indigo-600 text-indigo-600 bg-white font-bold' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
            >
              Langkah Soal
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-3 px-3 border-b-2 text-center transition flex items-center justify-center gap-1.5 ${activeTab === 'chat' ? 'border-indigo-600 text-indigo-600 bg-white font-bold' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Diskusi</span>
              {chatMessages.length > 0 && (
                <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {chatMessages.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab Content: Steps & Goals */}
          {activeTab === 'whiteboard' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
              {/* Problem Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-indigo-700 font-bold">
                  <span>Rumus / Persamaan Fokus</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="bg-white border border-indigo-100 rounded-lg p-2.5 font-mono text-xs text-indigo-900 break-all font-semibold">
                  {session.targetEquation || 'dy/dx + P(x)y = Q(x)'}
                </div>
              </div>

              {/* Socratic Step Checklist */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs">Checklist Pemahaman</h4>
                  <span className="text-[11px] text-slate-500">
                    {steps.filter((s) => s.done).length}/{steps.length} Selesai
                  </span>
                </div>

                <div className="space-y-2">
                  {steps.map((step) => (
                    <button
                      key={step.id}
                      onClick={() => toggleStep(step.id)}
                      className={`w-full text-left p-2.5 rounded-lg border transition flex items-start gap-2.5 ${step.done ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'}`}
                    >
                      <div
                        className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border text-[10px] ${step.done ? 'bg-emerald-500 border-emerald-600 text-white font-bold' : 'border-slate-300 bg-slate-50'}`}
                      >
                        {step.done && '✓'}
                      </div>
                      <span className={`text-xs ${step.done ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}`}>
                        {step.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Peer Mentorship Tip */}
              <div className="bg-indigo-50 border border-indigo-200/80 rounded-xl p-3 text-[11px] text-indigo-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-indigo-800">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  Prinsip "Helping People Help Each Other"
                </p>
                <p className="text-slate-600 leading-relaxed">
                  Gunakan whiteboard untuk menguji pemahaman konsep sendiri. Mentor membimbing lewat tanya jawab (metode Socratic) agar daya nalar terasah.
                </p>
              </div>
            </div>
          )}

          {/* Tab Content: Live Chat */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
                {chatMessages.map((msg) => {
                  const isMe = msg.senderId === currentUser.id;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-0.5">
                        <span className="font-semibold text-slate-700">{msg.senderName}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'}`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-2.5 border-t border-slate-200 bg-white flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ketik pesan atau persamaan..."
                  className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 text-xs px-3 py-2 rounded-xl focus:border-indigo-600 outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="bg-white border-t border-slate-200/80 px-4 py-3 flex items-center justify-between gap-4 z-20 shadow-xs">
        {/* Left: Audio/Video Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMicOn(!isMicOn)}
            className={`p-3 rounded-full transition shadow-xs ${isMicOn ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-rose-600 hover:bg-rose-700 text-white'}`}
            title={isMicOn ? 'Matikan Mikrofon' : 'Nyalakan Mikrofon'}
          >
            {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsCameraOn(!isCameraOn)}
            className={`p-3 rounded-full transition shadow-xs ${isCameraOn ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-rose-600 hover:bg-rose-700 text-white'}`}
            title={isCameraOn ? 'Matikan Kamera' : 'Nyalakan Kamera'}
          >
            {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsScreenSharing(!isScreenSharing)}
            className={`p-3 rounded-full transition hidden sm:flex ${isScreenSharing ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
            title="Bagikan Layar (Screen Share)"
          >
            <ScreenShare className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Emoji Quick Reactions */}
        <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full shadow-xs">
          {['💡', '👏', '🔥', '❤️', '🚀', '🙌'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => triggerReaction(emoji)}
              className="text-lg hover:scale-130 transition-transform px-1 cursor-pointer"
              title={`Kirim Reaksi ${emoji}`}
            >
              {emoji}
            </button>
          ))}
          <div className="h-4 w-px bg-slate-300 mx-1" />
          <button
            onClick={() => setIsHandRaised(!isHandRaised)}
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition ${isHandRaised ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
            title="Angkat Tangan Bertanya"
          >
            <Hand className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Tanya</span>
          </button>
        </div>

        {/* Right: Leave / End Call */}
        <div className="flex items-center gap-2">
          {isCurrentUserMentor && (
            <button
              onClick={handleMentorLeave}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold px-3 py-2 rounded-xl transition"
            >
              <PhoneOff className="w-4 h-4 text-rose-500" />
              <span className="hidden sm:inline">Keluar Sesi</span>
            </button>
          )}
        </div>
      </div>

      {/* Sesi Selesai & Rating Mentor Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 text-slate-900">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 mx-auto flex items-center justify-center text-emerald-600 text-2xl shadow-inner">
                🎓
              </div>
              <h3 className="text-lg font-bold text-slate-900">Sesi Kolaborasi Berhasil!</h3>
              <p className="text-xs text-slate-600">
                Terima kasih telah saling membantu memecahkan tugas melalui TemanTugas.
              </p>
            </div>

            {/* Mentor Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3">
              <img
                src={session.mentor.avatar}
                alt={session.mentor.name}
                className="w-12 h-12 rounded-full object-cover border border-indigo-300"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{session.mentor.name}</p>
                <p className="text-[11px] text-indigo-600 font-semibold">Mentor Rekan Pendamping</p>
                <p className="text-[10px] text-slate-500">Durasi: {formatTimer(elapsedSeconds)} menit</p>
              </div>
            </div>

            {/* Star Rating */}
            <div className="space-y-2 text-center">
              <label className="text-xs font-semibold text-slate-700">Beri Rating Penjelasan Mentor:</label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setMentorRating(star)}
                    className="p-1 hover:scale-125 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 ${star <= mentorRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Review Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Ulasan & Ucapan Terima Kasih:</label>
              <textarea
                rows={2}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs p-3 rounded-xl focus:border-indigo-600 outline-none"
              />
            </div>

            {/* Bonus Honor Coins */}
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs">
              <span className="text-amber-900 font-bold flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-600" />
                Beri Tip Bonus TemanCoins:
              </span>
              <div className="flex gap-1.5">
                {[0, 10, 25, 50].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setAwardedBonus(amount)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${awardedBonus === amount ? 'bg-amber-500 text-slate-950 font-extrabold' : 'bg-white border border-amber-200 text-amber-800 hover:bg-amber-100'}`}
                  >
                    +{amount}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowCompletionModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Kembali
              </button>
              <button
                onClick={handleConfirmFinish}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md transition"
              >
                Kirim & Selesaikan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Ended Modals */}
      {sessionEndedReason && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-6 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto flex items-center justify-center">
              <span className="text-2xl">
                {sessionEndedReason === 'mentor_left' ? '👋' : '🎉'}
              </span>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {sessionEndedReason === 'mentor_left' ? 'Sesi Selesai' : 'Siswa Selesai'}
              </h3>
              <p className="text-sm text-slate-600">
                {sessionEndedReason === 'mentor_left' 
                  ? 'Mentor telah meninggalkan sesi.' 
                  : 'Siswa telah menyelesaikan sesi ini dan memberikan ulasan.'}
              </p>
            </div>

            <button
              onClick={onLeaveRoom}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
