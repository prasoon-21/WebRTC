import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { useSocket } from '../providers/Socket';
import { usePeer } from '../providers/Peer';
import styles from './VideoCall.module.css';

const VideoCall = () => {
    const { roomId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email || `User-${Math.floor(Math.random() * 1000)}`;

    const socket = useSocket();
    const { peer, createOffer, createAnswer, addIceCandidate } = usePeer();

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [mediaReady, setMediaReady] = useState(false);
    const [remoteSocketId, setRemoteSocketId] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('Initializing...');

    // Controls state
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    const remoteSocketIdRef = useRef(null);

    // 1. Get User Media
    useEffect(() => {
        const getMedia = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setStream(mediaStream);
                if (localVideoRef.current) localVideoRef.current.srcObject = mediaStream;
                setMediaReady(true);
                setConnectionStatus('Waiting for peer...');
            } catch (e) {
                try {
                    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    setStream(audioStream);
                    setMediaReady(true);
                    setConnectionStatus('Audio Only');
                } catch (err) {
                    setConnectionStatus('No Media Access');
                    setMediaReady(true);
                }
            }
        };
        getMedia();
    }, []);

    // 2. Add Tracks
    useEffect(() => {
        if (!stream || !peer || peer.signalingState === 'closed') return;
        stream.getTracks().forEach(track => {
            const senders = peer.getSenders();
            const alreadyAdded = senders.find(s => s.track === track);
            if (!alreadyAdded) {
                peer.addTrack(track, stream);
            }
        });
    }, [stream, peer]);

    // 3. Control Toggles
    const toggleMic = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    const endCall = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        socket.disconnect();
        navigate('/');
    };

    // 4. Signaling Event Handlers
    const handleOffer = useCallback(async ({ from, offer }) => {
        console.log('[RTC] Offer received from:', from);
        setRemoteSocketId(from);
        remoteSocketIdRef.current = from;
        const answer = await createAnswer(offer);
        socket.emit('answer', { to: from, answer });
    }, [socket, createAnswer]);

    const handleAnswer = useCallback(async ({ from, answer }) => {
        console.log('[RTC] Answer received from:', from);
        setRemoteSocketId(from);
        remoteSocketIdRef.current = from;
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
    }, [peer]);

    const handleIceCandidate = useCallback(async ({ from, candidate }) => {
        console.log('[RTC] ICE Candidate received from:', from);
        await addIceCandidate(candidate);
    }, [addIceCandidate]);

    const handleUserJoined = useCallback(async ({ emailId, socketId }) => {
        console.log('[RTC] User joined:', emailId, socketId);
        setRemoteSocketId(socketId);
        remoteSocketIdRef.current = socketId;
        const offer = await createOffer();
        socket.emit('offer', { to: socketId, offer });
    }, [socket, createOffer]);

    const handleRoomClosed = useCallback(({ reason }) => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        navigate('/', { state: { message: reason } });
    }, [navigate, stream]);

    // 5. Room Join Effect (Runs once)
    useEffect(() => {
        if (!socket || !mediaReady) return;
        socket.emit('join-room', { roomId, emailId: email });
    }, [socket, mediaReady, roomId, email]);

    // 6. Setup Listeners
    useEffect(() => {
        if (!socket || !peer || !mediaReady) return;

        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleIceCandidate);
        socket.on('user-joined', handleUserJoined);
        socket.on('room-closed', handleRoomClosed);

        const onIceCandidate = (event) => {
            if (event.candidate && remoteSocketIdRef.current) {
                console.log('[RTC] Sending ICE candidate to:', remoteSocketIdRef.current);
                socket.emit('ice-candidate', { to: remoteSocketIdRef.current, candidate: event.candidate });
            }
        };

        const onTrack = (event) => {
            console.log('[RTC] Remote track received');
            const [remoteStream] = event.streams;
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
            }
            setConnectionStatus('Encrypted P2P Link Active');
        };

        peer.addEventListener('icecandidate', onIceCandidate);
        peer.addEventListener('track', onTrack);

        return () => {
            socket.off('offer', handleOffer);
            socket.off('answer', handleAnswer);
            socket.off('ice-candidate', handleIceCandidate);
            socket.off('user-joined', handleUserJoined);
            socket.off('room-closed', handleRoomClosed);
            peer.removeEventListener('icecandidate', onIceCandidate);
            peer.removeEventListener('track', onTrack);
        };
    }, [socket, peer, mediaReady, handleOffer, handleAnswer, handleIceCandidate, handleUserJoined, handleRoomClosed]);


    return (
        <div className={styles.container}>
            <div className={styles.statusBadge}>
                <div className={styles.statusDot} style={{ backgroundColor: remoteSocketId ? '#00ff00' : '#ffaa00' }} />
                <span>{connectionStatus}</span>
            </div>

            <video ref={localVideoRef} autoPlay muted playsInline className={styles.local} />
            <video ref={remoteVideoRef} autoPlay playsInline className={styles.remote} />

            <div className={styles.controls}>
                <button onClick={toggleMic} className={`${styles.controlBtn} ${isMuted ? styles.active : ''}`}>
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>
                <button onClick={toggleVideo} className={`${styles.controlBtn} ${isVideoOff ? styles.active : ''}`}>
                    {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                </button>
                <button onClick={endCall} className={`${styles.controlBtn} ${styles.endCall}`}>
                    <PhoneOff size={24} />
                </button>
            </div>
        </div>
    );
};


export default VideoCall;
