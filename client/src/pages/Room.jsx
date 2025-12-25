import React from 'react';
import { useParams } from 'react-router-dom';
import VideoCall from '../components/VideoCall';

const RoomPage = () => {
    return (
        <div style={{ width: '100%', height: '100vh', backgroundColor: '#0a0a0a' }}>
            <VideoCall />
        </div>
    );
};

export default RoomPage;