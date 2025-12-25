import React, { createContext, useContext, useMemo } from 'react';

// Create Peer context
const PeerContext = createContext(null);

export const usePeer = () => useContext(PeerContext);

export const PeerProvider = (props) => {
  const [peer, setPeer] = React.useState(() => new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:global.stun.twilio.com:3478'
        ]
      }
    ]
  }));

  React.useEffect(() => {
    return () => {
      if (peer) {
        console.log('[RTC] Closing peer connection');
        peer.close();
      }
    };
  }, [peer]);

  const candidatesQueue = React.useRef([]);

  // Create offer
  const createOffer = async () => {
    if (peer.signalingState === 'closed') return;
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    return offer;
  };

  // Create answer from remote offer
  const createAnswer = async (remoteOffer) => {
    if (peer.signalingState === 'closed') return;
    await peer.setRemoteDescription(new RTCSessionDescription(remoteOffer));

    // Process queued candidates
    if (candidatesQueue.current.length > 0) {
      for (const candidate of candidatesQueue.current) {
        await peer.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error(e));
      }
      candidatesQueue.current = [];
    }

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    return answer;
  };

  // Add ICE candidate received from remote peer
  const addIceCandidate = async (candidate) => {
    try {
      if (!candidate) return;

      if (peer.remoteDescription && peer.remoteDescription.type) {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        candidatesQueue.current.push(candidate);
      }
    } catch (e) {
      console.error('[RTC] Error adding ICE candidate', e);
    }
  };

  // Effect to process candidates when remoteDescription is set (for the offeror)
  React.useEffect(() => {
    const handleSignalingStateChange = () => {
      if (peer.remoteDescription && peer.remoteDescription.type && candidatesQueue.current.length > 0) {
        console.log('[RTC] Processing queued candidates after remote description set');
        candidatesQueue.current.forEach(c => peer.addIceCandidate(new RTCIceCandidate(c)).catch(e => console.error(e)));
        candidatesQueue.current = [];
      }
    };
    peer.addEventListener('signalingstatechange', handleSignalingStateChange);
    return () => peer.removeEventListener('signalingstatechange', handleSignalingStateChange);
  }, [peer]);

  return (
    <PeerContext.Provider value={{ peer, createOffer, createAnswer, addIceCandidate }}>
      {props.children}
    </PeerContext.Provider>
  );
};
