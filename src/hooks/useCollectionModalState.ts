import { useState, useEffect, useMemo } from 'react';

export function useCollectionModalState(completedIds: Set<string>, activeCategory: string) {
  const [bulkInput, setBulkInput] = useState('');
  const [unmatchedNames, setUnmatchedNames] = useState<string[]>([]);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [tempCompletedIds, setTempCompletedIds] = useState<Set<string>>(new Set());
  const [initialModalCompletedIds, setInitialModalCompletedIds] = useState<Set<string>>(new Set());
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);

  const setsAreEqual = (a: Set<string>, b: Set<string>) => {
    if (a.size !== b.size) return false;
    for (const x of a) if (!b.has(x)) return false;
    return true;
  };

  function handleCloseModal() {
    const hasUnsavedChanges = 
      bulkInput.trim().length > 0 || 
      !setsAreEqual(tempCompletedIds, initialModalCompletedIds);

    if (hasUnsavedChanges) {
      setShowConfirmClose(true);
    } else {
      setIsCollectionModalOpen(false);
      setBulkInput('');
    }
  }

  useEffect(() => {
    if (isCollectionModalOpen) {
      const initialSet = new Set(completedIds);
      setTempCompletedIds(initialSet);
      setInitialModalCompletedIds(new Set(completedIds));
    }
  }, [isCollectionModalOpen, activeCategory]);

  const bulkPlaceholder = useMemo(() => {
    switch (activeCategory) {
      case 'birds':
        return "굴뚝새/3\n꼬까울새/4\n노랑배박새/5";
      case 'insects':
        return "멧노랑나비/3\n배추흰나비/4\n별노린재/5";
      case 'fishing':
        return "가다랑어/3\n갈치/4\n극지연어/5";
      case 'cooking':
        return "믹스드 잼/3\n블루베리 잼/4\n라즈베리 잼/5";
      case 'crops':
        return "토마토/3\n벼/4\n트러플/5";
      case 'gardening':
        return "데이지/3\n팬지/4\n감자/5\n\n* 원예/작물 통합 입력 가능";
      case 'ocean_cleaning':
        return "손상된 조개껍데기/3\n고토이 심해고둥/4\n루시나조개/5";
      default:
        return "아이템명/별점\n아이템명/별점\n아이템명/별점";
    }
  }, [activeCategory]);

  return {
    bulkInput,
    setBulkInput,
    unmatchedNames,
    setUnmatchedNames,
    isCollectionModalOpen,
    setIsCollectionModalOpen,
    tempCompletedIds,
    setTempCompletedIds,
    initialModalCompletedIds,
    setInitialModalCompletedIds,
    showConfirmClose,
    setShowConfirmClose,
    showOverwriteConfirm,
    setShowOverwriteConfirm,
    setsAreEqual,
    handleCloseModal,
    bulkPlaceholder,
  };
}
