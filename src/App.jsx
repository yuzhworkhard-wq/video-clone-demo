import React, { useState } from 'react';
import { ToolboxPage } from './ToolboxPage';
import { CloneModal } from './CloneModal';
import './styles.css';

export default function App() {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <>
      <ToolboxPage onStartClone={() => setModalOpen(true)} />
      {modalOpen && <CloneModal onClose={() => setModalOpen(false)} />}
    </>
  );
}
