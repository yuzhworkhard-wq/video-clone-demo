import React, { useState } from 'react';
import { ToolboxPage } from './ToolboxPage';
import { CloneModal } from './CloneModal';
import { VideoGenModal } from './VideoGenModal';
import './styles.css';

export default function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [videoGenOpen, setVideoGenOpen] = useState(false);
  return (
    <>
      <ToolboxPage
        onStartClone={() => setModalOpen(true)}
        onStartVideoGen={() => setVideoGenOpen(true)}
      />
      {modalOpen && <CloneModal onClose={() => setModalOpen(false)} />}
      {videoGenOpen && <VideoGenModal onClose={() => setVideoGenOpen(false)} />}
    </>
  );
}
