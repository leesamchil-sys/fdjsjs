import { useEffect, useRef } from 'react';

interface ActiveModal {
  modalId: string;
  close: () => void;
}

// Global stack of active modals
const activeModals: ActiveModal[] = [];
let isPopstateListening = false;
let ignorePopStateCount = 0;

// popstate event handler
const handlePopState = (event: PopStateEvent) => {
  if (ignorePopStateCount > 0) {
    ignorePopStateCount--;
    return;
  }
  if (activeModals.length > 0) {
    // Pop the topmost modal and trigger its close function
    const lastModal = activeModals.pop();
    if (lastModal) {
      lastModal.close();
    }
  }
};

export function useBackDismiss(isOpen: boolean, onClose: () => void, modalId: string) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Register popstate listener once globally
    if (!isPopstateListening) {
      window.addEventListener('popstate', handlePopState);
      isPopstateListening = true;
    }

    if (!isOpen) return;

    // When the modal opens, push a virtual state onto browser history
    window.history.pushState({ modalId }, '');

    const currentModal: ActiveModal = {
      modalId,
      close: () => {
        onCloseRef.current();
      }
    };

    activeModals.push(currentModal);

    return () => {
      // Cleanup when closed (either by hardware back key or user manual action)
      const index = activeModals.findIndex(m => m.modalId === modalId);
      
      if (index !== -1) {
        // If the index is still in the stack, the modal was closed manually by the user
        // (rather than hardware back, which already popped it in handlePopState).
        activeModals.splice(index, 1);
        
        // Remove the virtual state from the history
        if (window.history.state?.modalId === modalId) {
          ignorePopStateCount++;
          window.history.back();
        }
      }
    };
  }, [isOpen, modalId]);
}
