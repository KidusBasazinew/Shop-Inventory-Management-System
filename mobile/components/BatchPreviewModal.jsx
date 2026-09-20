import { useBatchesForMedicine } from "../hooks/useBatches";
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { X } from "lucide-react-native";

const BatchPreviewModal = ({ medicine, onClose, onConfirm }) => {
  const { data: batches, isLoading } = useBatchesForMedicine(medicine?.id);

  // Computed once and reused for both display AND pricing — the two must
  // never disagree about which batch is "next to sell." Previously the
  // sort/filter only fed the ScrollView; now it also feeds the price.
  const fefoBatches = [...(batches ?? [])]
    .filter((b) => b.quantity > 0)
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

  const totalStock = fefoBatches.reduce((sum, b) => sum + b.quantity, 0);
  const nextBatch = fefoBatches[0]; // the one the backend's FEFO logic will actually draw from first

  const soon = new Date();
  soon.setDate(soon.getDate() + 60); // flag anything expiring within 60 days

  const handleConfirm = () => {
    // FIX: this used to be onConfirm(medicine) — the raw medicine record,
    // which has no price field at all (price only ever lives on a batch,
    // see schema.prisma). Attach the FEFO-first batch's sellPrice here so
    // Sales.jsx's addToCart() has something real to work with.
    onConfirm({
      ...medicine,
      sellingPrice: Number(nextBatch?.sellPrice ?? 0),
    });
  };

  return (
    <Modal visible={!!medicine} animationType="fade" transparent>
      <View className="flex-1 bg-black/40 items-center justify-center px-6">
        <View className="bg-surface rounded-2xl p-6 w-full max-h-[80%] gap-4">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-lg font-bold text-on-surface">
                {medicine?.name}
              </Text>
              <Text className="text-xs text-on-surface-variant">
                Total stock: {totalStock} {medicine?.unit?.toLowerCase()}
              </Text>
              {nextBatch && (
                <Text className="text-xs text-primary font-semibold mt-0.5">
                  ETB {Number(nextBatch.sellPrice).toFixed(2)} / unit
                </Text>
              )}
            </View>
            <Pressable onPress={onClose}>
              <X size={22} color="#434655" />
            </Pressable>
          </View>

          {isLoading ? (
            <ActivityIndicator />
          ) : fefoBatches.length === 0 ? (
            <Text className="text-on-surface-variant text-center py-6">
              No stock available for this medicine
            </Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="gap-2">
                <Text className="text-xs font-semibold text-outline">
                  SELL ORDER (soonest expiry first)
                </Text>
                {fefoBatches.map((batch, idx) => {
                  const expiryDate = new Date(batch.expiryDate);
                  const isExpiringSoon = expiryDate <= soon;
                  return (
                    <View
                      key={batch.id}
                      className={`p-3 rounded-xl border flex-row justify-between items-center ${
                        isExpiringSoon
                          ? "border-error/40 bg-error-container/20"
                          : "border-outline-variant/30 bg-surface-container-low"
                      }`}
                    >
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                          <View className="w-5 h-5 rounded-full bg-primary/10 items-center justify-center">
                            <Text className="text-[10px] font-bold text-primary">
                              {idx + 1}
                            </Text>
                          </View>
                          <Text className="font-medium text-on-surface text-sm">
                            {batch.batchNumber}
                          </Text>
                        </View>
                        <Text
                          className={`text-xs mt-1 ${
                            isExpiringSoon
                              ? "text-error font-semibold"
                              : "text-on-surface-variant"
                          }`}
                        >
                          Expires {expiryDate.toLocaleDateString()}
                          {isExpiringSoon ? " — expiring soon" : ""}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="font-bold text-on-surface">
                          {batch.quantity}
                        </Text>
                        <Text className="text-xs text-on-surface-variant">
                          ETB {Number(batch.sellPrice).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}

          <Pressable
            onPress={handleConfirm}
            disabled={totalStock === 0}
            className="bg-primary rounded-xl py-4 items-center"
            style={{ opacity: totalStock === 0 ? 0.4 : 1 }}
          >
            <Text className="text-white font-semibold">Add to Cart</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default BatchPreviewModal;
