import React, { createContext, useContext, useMemo } from 'react';

// Create Peer context
const PeerContext = createContext(null);

export const usePeer = () => useContext(PeerContext);

export const PeerProvider = (props) => {
  // Initialize RTCPeerConnection with STUN servers
  const peer = useMemo(() => new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:global.stun.twilio.com:3478'
        ]
      }
    ]
  }), []);

  // Removed the useEffect cleanup peer.close() because React 18 StrictMode 
  // triggers it prematurely during double-mount, which closes the 
  // RTCPeerConnection before it can be used.


  // Create offer
  const createOffer = async () => {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    return offer;
  };

  // Create answer from remote offer
  const createAnswer = async (remoteOffer) => {
    await peer.setRemoteDescription(remoteOffer);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    return answer;
  };

  // Add ICE candidate received from remote peer
  const addIceCandidate = async (candidate) => {
    try {
      await peer.addIceCandidate(candidate);
    } catch (e) {
      console.error('Error adding ICE candidate', e);
    }
  };

  // Expose peer and helper functions
  return (
    <PeerContext.Provider value={{ peer, createOffer, createAnswer, addIceCandidate }}>
      {props.children}
    </PeerContext.Provider>
  );
};