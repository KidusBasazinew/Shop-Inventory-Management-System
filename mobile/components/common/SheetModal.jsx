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
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";

const SheetModal = forwardRef(function SheetModal(
  { visible, onClose, children, snapPoints: customSnapPoints },
  ref,
) {
  const bottomSheetRef = useRef(null);
  const hasPresentedRef = useRef(false);
  const snapPoints = useMemo(
    () => customSnapPoints ?? ["60%", "90%"],
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
      index={0}
      stackBehavior="push"
      enableDynamicSizing={false}
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backgroundStyle={{
        backgroundColor: "#ffffff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      }}
      handleIndicatorStyle={{ backgroundColor: "#c3c6d7" }}
    >
      <BottomSheetView style={{ flex: 1 }}>{children}</BottomSheetView>
    </BottomSheetModal>
  );
});

export default SheetModal;
