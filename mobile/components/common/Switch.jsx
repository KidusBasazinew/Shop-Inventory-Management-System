import { Switch as RNSwitch } from "react-native";

export default function Switch({ value, onValueChange }) {
  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: "#e2e5ec", true: "#004ac6" }}
      thumbColor="#ffffff"
    />
  );
}
