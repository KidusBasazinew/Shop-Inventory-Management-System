import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";

const SheetModal = forwardRef(function SheetModal(
  {
    visible,
    onClose,
    children,
    snapPoints: customSnapPoints,
    initialIndex = 1,
    scrollable = true,
    enablePanDownToClose = true,
  },
  ref,
) {
  const bottomSheetRef = useRef(null);
  const hasPresentedRef = useRef(false);

  const snapPoints = useMemo(
    () => customSnapPoints ?? ["50%", "94%"],
    [customSnapPoints],
  );

  useEffect(() => {
    if (!visible) {
      if (hasPresentedRef.current) bottomSheetRef.current?.dismiss();
      return;
    }

    const frame = requestAnimationFrame(() => {
      hasPresentedRef.current = true;
      bottomSheetRef.current?.present();
    });

    return () => cancelAnimationFrame(frame);
  }, [visible]);

  useImperativeHandle(ref, () => bottomSheetRef.current);

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.4}
        pressBehavior="close"
      />
    ),
    [],
  );

  const handleDismiss = useCallback(() => {
    hasPresentedRef.current = false;
    onClose?.();
  }, [onClose]);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      index={initialIndex}
      stackBehavior="push"
      enableDynamicSizing={false}
      enablePanDownToClose={enablePanDownToClose}
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      // On Android with edge-to-edge (always on in SDK 54 / Android 15+),
      // the OS disables `adjustResize`, so the sheet must NOT delegate to the
      // native window resize. `adjustPan` is gorhom's default and makes the
      // sheet lift itself by the keyboard height instead.
      android_keyboardInputMode="adjustPan"
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      backgroundStyle={{
        backgroundColor: "#ffffff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      }}
      handleIndicatorStyle={{ backgroundColor: "#c3c6d7" }}
    >
      {scrollable ? (
        <BottomSheetScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          {children}
        </BottomSheetScrollView>
      ) : (
        <BottomSheetView style={{ flex: 1 }}>{children}</BottomSheetView>
      )}
    </BottomSheetModal>
  );
});

export default SheetModal;
