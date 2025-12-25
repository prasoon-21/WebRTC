import { Routes, Route } from 'react-router-dom';
import './App.css';
import Homepage from './pages/Home';
import { SocketProvider } from './providers/Socket';
import RoomPage from './pages/Room';
import { PeerProvider } from './providers/Peer';


function App() {
  return (
    <div className="App">
      <SocketProvider>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route
            path="/room/:roomId"
            element={
              <PeerProvider>
                <RoomPage />
              </PeerProvider>
            }
          />
        </Routes>
      </SocketProvider>
    </div>
  );
}


export default App;
