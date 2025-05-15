import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

// Types
interface UIState {
  activeTab: string;
  sidebarOpen: boolean;
  activeRoomId: string | null;
  modalOpen: {
    addRoom: boolean;
    editRoom: boolean;
    addProduct: boolean;
    viewProduct: boolean;
    uploadPhoto: boolean;
  };
  modalData: any;
}

// Initial state
const initialState: UIState = {
  activeTab: 'conversation',
  sidebarOpen: true,
  activeRoomId: null,
  modalOpen: {
    addRoom: false,
    editRoom: false,
    addProduct: false,
    viewProduct: false,
    uploadPhoto: false,
  },
  modalData: null,
};

// Slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setActiveRoomId: (state, action: PayloadAction<string | null>) => {
      state.activeRoomId = action.payload;
    },
    openModal: (state, action: PayloadAction<{ type: keyof UIState['modalOpen']; data?: any }>) => {
      state.modalOpen[action.payload.type] = true;
      state.modalData = action.payload.data || null;
    },
    closeModal: (state, action: PayloadAction<keyof UIState['modalOpen']>) => {
      state.modalOpen[action.payload] = false;
      if (Object.values(state.modalOpen).every(value => !value)) {
        state.modalData = null;
      }
    },
    closeAllModals: (state) => {
      Object.keys(state.modalOpen).forEach(key => {
        state.modalOpen[key as keyof UIState['modalOpen']] = false;
      });
      state.modalData = null;
    },
  },
});

export const {
  setActiveTab,
  toggleSidebar,
  setSidebarOpen,
  setActiveRoomId,
  openModal,
  closeModal,
  closeAllModals,
} = uiSlice.actions;

export const selectActiveTab = (state: RootState) => state.ui.activeTab;
export const selectSidebarOpen = (state: RootState) => state.ui.sidebarOpen;
export const selectActiveRoomId = (state: RootState) => state.ui.activeRoomId;
export const selectModalOpen = (state: RootState) => state.ui.modalOpen;
export const selectModalData = (state: RootState) => state.ui.modalData;

export default uiSlice.reducer;
