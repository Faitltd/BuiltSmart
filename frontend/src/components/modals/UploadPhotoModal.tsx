import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../store';
import { closeModal, selectActiveRoomId } from '../../store/slices/uiSlice';
import { selectCurrentEstimate } from '../../store/slices/estimateSlice';
import Modal from './Modal';
import PhotoUploader from '../PhotoUploader';

const UploadPhotoModal: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  const dispatch = useDispatch<AppDispatch>();
  const estimate = useSelector(selectCurrentEstimate);
  const activeRoomId = useSelector(selectActiveRoomId);

  const handleClose = () => {
    dispatch(closeModal('uploadPhoto'));
  };

  const handleUploadComplete = (photoUrl: string) => {
    // Close modal after successful upload
    handleClose();
  };

  if (!estimate || !activeRoomId) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload Photo">
      <PhotoUploader
        estimateId={estimate.id}
        roomId={activeRoomId}
        onUploadComplete={handleUploadComplete}
      />
    </Modal>
  );
};

export default UploadPhotoModal;
