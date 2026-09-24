import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Linking,
  Image,
} from "react-native";
import {
  Phone,
  Mail,
  MessageCircle,
  Globe,
  ChevronDown,
  LifeBuoy,
  ExternalLink,
} from "lucide-react-native";

// TODO: replace with the real shop support number (used for both Call and WhatsApp)
const SUPPORT_PHONE = "+251918704215";
const SUPPORT_EMAIL = "kixlabs@gmail.com";
const SUPPORT_WEBSITE = "kixlabs.tech";

const FAQS = [
  {
    q: "How does stock get deducted when I make a sale?",
    a: "Completing a sale immediately reduces the quantity on each product sold, and logs a stock movement so you can trace exactly when and why your stock changed.",
  },
  {
    q: "What happens with a partial or credit sale?",
    a: "Pick a customer and set how much they're paying now — anything less than the full total is tracked as a balance owed. You can settle it later from that sale's details or from the customer's record.",
  },
  {
    q: "Can I bring back a deactivated product?",
    a: "Deactivating a product only hides it from active inventory and new sales — its history stays intact. Ask an owner or manager to reactivate it if needed.",
  },
  {
    q: "Who can see profit and financial reports?",
    a: "Profit, tax, and payroll details are limited to Owners and Managers. Cashiers can process sales and log waste but won't see margin or salary data.",
  },
  {
    q: "How do low stock and expiry alerts work?",
    a: "Each product has its own reorder threshold and optional expiry date — the dashboard and Inventory tab flag anything at or below threshold, or expiring within 30 days.",
  },
];

const CONTACT_ACTIONS = [
  {
    icon: MessageCircle,
    label: "WhatsApp",
    onPress: () =>
      Linking.openURL(`https://wa.me/${SUPPORT_PHONE.replace(/[^\d]/g, "")}`),
  },
  {
    icon: Phone,
    label: "Call Us",
    onPress: () => Linking.openURL(`tel:${SUPPORT_PHONE}`),
  },
  {
    icon: Mail,
    label: "Email",
    onPress: () => Linking.openURL(`mailto:${SUPPORT_EMAIL}`),
  },
];

export default function HelpScreen() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 24 }}
    >
      {/* Header */}
      <View className="items-center pt-4">
        <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
          <LifeBuoy size={28} color="#004ac6" strokeWidth={1.75} />
        </View>
        <Text className="text-xl font-bold text-on-surface">
          Help & Support
        </Text>
        <Text className="text-sm text-on-surface-variant mt-1 text-center">
          We're here whenever you need us
        </Text>
      </View>

      {/* Contact row */}
      <View className="flex-row justify-between px-2 py-4 rounded-2xl border border-outline-variant/20">
        {CONTACT_ACTIONS.map((action) => (
          <Pressable
            key={action.label}
            onPress={action.onPress}
            className="items-center gap-2 flex-1"
          >
            <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
              <action.icon size={20} color="#004ac6" strokeWidth={1.75} />
            </View>
            <Text className="text-[12px] font-medium text-on-surface-variant text-center">
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* FAQ */}
      <View>
        <Text className="text-[13px] font-semibold text-on-surface mb-3">
          Frequently Asked Questions
        </Text>

        <View className="rounded-2xl overflow-hidden border border-outline-variant/20">
          {FAQS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <View key={item.q}>
                <Pressable
                  onPress={() => setOpenIndex(isOpen ? null : index)}
                  className={`flex-row items-center justify-between px-4 py-4 ${
                    index !== FAQS.length - 1
                      ? "border-b border-outline-variant/15"
                      : ""
                  }`}
                >
                  <Text className="flex-1 text-[14px] font-medium text-on-surface pr-3">
                    {item.q}
                  </Text>
                  <View
                    style={{
                      transform: [{ rotate: isOpen ? "180deg" : "0deg" }],
                    }}
                  >
                    <ChevronDown size={18} color="#9aa0a6" />
                  </View>
                </Pressable>

                {isOpen ? (
                  <View
                    className={`px-4 pb-4 ${index !== FAQS.length - 1 ? "border-b border-outline-variant/15" : ""}`}
                  >
                    <Text className="text-[13px] text-on-surface-variant leading-5">
                      {item.a}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </View>

      {/* Website link */}
      <Pressable
        onPress={() => Linking.openURL(`https://${SUPPORT_WEBSITE}`)}
        className="bg-primary/10 rounded-2xl px-4 py-4 flex-row items-center gap-3"
      >
        <View className="w-10 h-10 rounded-full bg-surface items-center justify-center">
          <Globe size={18} color="#004ac6" strokeWidth={1.75} />
        </View>
        <View className="flex-1">
          <Text className="text-[14px] font-semibold text-on-surface">
            {SUPPORT_WEBSITE}
          </Text>
          <Text className="text-[12px] text-on-surface-variant mt-0.5">
            Visit our website
          </Text>
        </View>
        <ExternalLink size={16} color="#004ac6" />
      </Pressable>

      {/* Footer — KixLabs branding */}
      <View className="items-center pt-2 gap-2">
        {/* TODO: uncomment once assets/kixlabs-logo.png exists */}
        <Image
          source={require("../../assets/kixlabs-logo.png")}
          style={{ width: 40, height: 40 }}
          resizeMode="contain"
        />
        <Text className="text-[13px] font-bold text-on-surface-variant">
          KixLabs
        </Text>
        <Text className="text-[12px] text-outline">{SUPPORT_EMAIL}</Text>
        <Text className="text-[12px] text-outline">Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}
