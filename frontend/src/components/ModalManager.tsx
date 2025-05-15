import React from 'react';
import { useSelector } from 'react-redux';
import { selectModalOpen } from '../store/slices/uiSlice';
import AddRoomModal from './modals/AddRoomModal';
import EditRoomModal from './modals/EditRoomModal';
import AddProductModal from './modals/AddProductModal';
import ViewProductModal from './modals/ViewProductModal';
import UploadPhotoModal from './modals/UploadPhotoModal';

const ModalManager: React.FC = () => {
  const modalOpen = useSelector(selectModalOpen);
  
  return (
    <>
      <AddRoomModal isOpen={modalOpen.addRoom} />
      <EditRoomModal isOpen={modalOpen.editRoom} />
      <AddProductModal isOpen={modalOpen.addProduct} />
      <ViewProductModal isOpen={modalOpen.viewProduct} />
      <UploadPhotoModal isOpen={modalOpen.uploadPhoto} />
    </>
  );
};

export default ModalManager;
