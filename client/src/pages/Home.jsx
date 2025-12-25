import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Zap, Mail, ShieldCheck, Cpu } from 'lucide-react';
import { useSocket } from '../providers/Socket';
import styles from './Home.module.css';

const Homepage = () => {
    const socket = useSocket();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [roomId, setRoomId] = useState('');

    const handleRoomJoined = useCallback(({ roomId }) => {
        console.log(`[CLIENT] Room Joined: ${roomId}`);
        navigate(`/room/${roomId}`, { state: { email: email || 'Anonymous' } });
    }, [navigate, email]);

    useEffect(() => {
        if (!socket) return;

        const handleJoinError = ({ message }) => {
            alert(message);
        };

        socket.on('joined-room', handleRoomJoined);
        socket.on('join-error', handleJoinError);

        return () => {
            socket.off('joined-room', handleRoomJoined);
            socket.off('join-error', handleJoinError);
        };
    }, [socket, handleRoomJoined]);

    const handleJoinRoom = () => {
        if (!email || !roomId) {
            alert('Please enter both your ID and the Secret Room ID.');
            return;
        }
        console.log('[CLIENT] Joining Room:', { email, roomId });
        socket.emit('join-room', { roomId, emailId: email });
    };

    return (
        <div className={styles.pageWrapper}>
            {/* Mesh Background Blobs */}
            <div className={styles.meshBg}>
                <div className={`${styles.blob} ${styles.blob1}`} />
                <div className={`${styles.blob} ${styles.blob2}`} />
                <div className={`${styles.blob} ${styles.blob3}`} />
            </div>

            {/* Floating Background Icons */}
            <div className={styles.floatingIcons}>
                <Shield className={styles.iconAsset} style={{ top: '15%', left: '10%', animationDelay: '0s' }} size={48} />
                <Lock className={styles.iconAsset} style={{ top: '25%', right: '15%', animationDelay: '2s' }} size={32} />
                <Zap className={styles.iconAsset} style={{ bottom: '20%', left: '20%', animationDelay: '4s' }} size={40} />
                <ShieldCheck className={styles.iconAsset} style={{ bottom: '15%', right: '25%', animationDelay: '1s' }} size={36} />
                <Cpu className={styles.iconAsset} style={{ top: '60%', left: '5%', animationDelay: '3s' }} size={28} />
            </div>

            {/* Top Bar Header */}
            <header className={styles.header}>
                <div className={styles.logo}>BINARY ASESINO</div>
                <div className={styles.badge} style={{ flexDirection: 'row', color: '#ffffffff' }}>
                    <ShieldCheck size={20} />
                    <span style={{ fontWeight: '600' }}>Secure Signaling</span>
                </div>
            </header>

            {/* Main Hero Section */}
            <main className={styles.main}>
                <div className={styles.heroSection}>
                    <h1 className={styles.title}>Private. Secure.<br />One-to-One.</h1>
                    <p className={styles.subtitle}>
                        Experience military-grade privacy with peer-to-peer encryption.
                        No servers store your logs. No one can listen in.
                    </p>

                    <div className={styles.joinCard}>
                        <div className={styles.inputGroup}>
                            <input
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                type="text"
                                placeholder="Choose a Display Name"
                                className={styles.glassInput}
                            />
                            <input
                                value={roomId}
                                onChange={e => setRoomId(e.target.value)}
                                type="text"
                                placeholder="Meeting Secret ID"
                                className={styles.glassInput}
                            />
                        </div>
                        <button onClick={handleJoinRoom} className={styles.actionBtn}>
                            Sheilded Join
                        </button>
                    </div>

                    <div className={styles.badgesContainer}>
                        <div className={styles.badge}>
                            <Lock className={styles.badgeIcon} size={24} />
                            <span>Encrypted P2P</span>
                        </div>
                        <div className={styles.badge}>
                            <Shield className={styles.badgeIcon} size={24} />
                            <span>Zero Data Logs</span>
                        </div>
                        <div className={styles.badge}>
                            <Zap className={styles.badgeIcon} size={24} />
                            <span>Ultra Low Latency</span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer Section */}
            <footer className={styles.footer}>
                <div className={styles.footerLeft}>
                    <span>&copy; 2025 Binary Asesino Group</span>
                    <span>|</span>
                    <Mail size={16} />
                    <a href="mailto:binaryasesino@gmail.com" className={styles.footerEmail}>binaryasesino@gmail.com</a>
                </div>
                <div>
                    Totally safe. Totally private.
                </div>
            </footer>
        </div>
    );
};

export default Homepage;
