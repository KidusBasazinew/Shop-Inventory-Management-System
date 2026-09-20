import { useState } from "react";
import { View, Text, Pressable, ScrollView, Linking } from "react-native";
import {
  Phone,
  Mail,
  MessageCircle,
  ChevronDown,
  BookOpen,
  ExternalLink,
  LifeBuoy,
} from "lucide-react-native";

const FAQS = [
  {
    q: "How does FEFO stock deduction work?",
    a: "When you complete a sale, the system automatically deducts stock from the batch with the soonest expiry date first — not the batch you picked. This keeps expiring stock moving before it has to be written off.",
  },
  {
    q: "Can a deactivated medicine be brought back?",
    a: "Deactivating a medicine only hides it from active inventory and sales — its sale history stays intact. Reactivating currently requires updating it directly; ask an owner if you need this done.",
  },
  {
    q: "Why can't I delete a supplier?",
    a: "A supplier can't be removed while it still has batches on record — this protects your purchase history. Reassign or clear those batches first, then the delete will go through.",
  },
  {
    q: "Who can see profit reports?",
    a: "Profit and daily revenue reports are limited to Owners and Managers. Cashiers can process sales but won't see margin data.",
  },
  {
    q: "What happens when my trial ends?",
    a: "Once your trial expires, the pharmacy account moves to Expired status and login is blocked until a subscription payment is completed from the Subscription page.",
  },
];

const CONTACT_ACTIONS = [
  {
    icon: Phone,
    label: "Call Us",
    onPress: () => Linking.openURL("tel:+251911000000"),
  },
  {
    icon: Mail,
    label: "Email",
    onPress: () => Linking.openURL("mailto:support@klabspharmacy.et"),
  },
  {
    icon: MessageCircle,
    label: "Telegram",
    onPress: () => Linking.openURL("https://t.me/klabspharmacy"),
  },
];

export default function HelpScreen() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 24 }}
    >
      {/* Header — same soft-circle language as login/onboarding */}
      <View className="items-center pt-4">
        <View className="w-16 h-16 rounded-full bg-blue-50 items-center justify-center mb-4">
          <LifeBuoy size={28} color="#2563eb" strokeWidth={1.75} />
        </View>
        <Text className="text-xl font-bold text-slate-900">Help & Support</Text>
        <Text className="text-sm text-slate-500 mt-1 text-center">
          We're here whenever you need us
        </Text>
      </View>

      {/* Contact row */}
      <View
        className="flex-row justify-between px-2 py-4 rounded-2xl"
        style={{ borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" }}
      >
        {CONTACT_ACTIONS.map((action) => (
          <Pressable
            key={action.label}
            onPress={action.onPress}
            className="items-center gap-2 flex-1"
          >
            <View className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center">
              <action.icon size={20} color="#2563eb" strokeWidth={1.75} />
            </View>
            <Text className="text-[12px] font-medium text-slate-500 text-center">
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* FAQ */}
      <View>
        <Text className="text-[13px] font-semibold text-slate-900 mb-3">
          Frequently Asked Questions
        </Text>

        <View
          className="rounded-2xl overflow-hidden"
          style={{ borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" }}
        >
          {FAQS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <View key={item.q}>
                <Pressable
                  onPress={() => setOpenIndex(isOpen ? null : index)}
                  className="flex-row items-center justify-between px-4 py-4"
                  style={
                    index !== FAQS.length - 1
                      ? {
                          borderBottomWidth: 1,
                          borderBottomColor: "rgba(0,0,0,0.06)",
                        }
                      : undefined
                  }
                >
                  <Text className="flex-1 text-[14px] font-medium text-slate-900 pr-3">
                    {item.q}
                  </Text>
                  <View
                    style={{
                      transform: [{ rotate: isOpen ? "180deg" : "0deg" }],
                    }}
                  >
                    <ChevronDown size={18} color="#94a3b8" />
                  </View>
                </Pressable>

                {isOpen ? (
                  <View
                    className="px-4 pb-4"
                    style={
                      index !== FAQS.length - 1
                        ? {
                            borderBottomWidth: 1,
                            borderBottomColor: "rgba(0,0,0,0.06)",
                          }
                        : undefined
                    }
                  >
                    <Text className="text-[13px] text-slate-500 leading-5">
                      {item.a}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </View>

      {/* Docs link */}
      <Pressable
        onPress={() => Linking.openURL("https://klabspharmacy.et/docs")}
        className="bg-blue-50 rounded-2xl px-4 py-4 flex-row items-center gap-3"
      >
        <View className="w-10 h-10 rounded-full bg-white items-center justify-center">
          <BookOpen size={18} color="#2563eb" strokeWidth={1.75} />
        </View>
        <View className="flex-1">
          <Text className="text-[14px] font-semibold text-slate-900">
            Full Documentation
          </Text>
          <Text className="text-[12px] text-slate-500 mt-0.5">
            Detailed guides for every feature
          </Text>
        </View>
        <ExternalLink size={16} color="#2563eb" />
      </Pressable>

      {/* Footer */}
      <View className="items-center pt-2">
        <Text className="text-[12px] text-slate-400">KLABS Pharmacy</Text>
        <Text className="text-[12px] text-slate-400 mt-0.5">Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}
