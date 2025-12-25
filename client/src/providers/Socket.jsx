import React, { useMemo, useEffect, createContext, useContext } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  const socket = useContext(SocketContext);
  return socket;
};

export const SocketProvider = (props) => {
  const socket = useMemo(() => io(process.env.REACT_APP_SIGNALING_URL || 'http://localhost:8001', {
    transports: ['websocket', 'polling'], // Allow both, socket.io will upgrade
    reconnection: true,
  }), []);


  useEffect(() => {
    socket.on('connect', () => console.log('[SOCKET] Connected:', socket.id));
    socket.on('disconnect', (reason) => console.log('[SOCKET] Disconnected:', reason));
    socket.on('connect_error', (error) => console.error('[SOCKET] Connection Error:', error));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={socket}>
      {props.children}
    </SocketContext.Provider>
  );
};
