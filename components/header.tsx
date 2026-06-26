import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Colors } from "@/constants/theme";
import { useUserStore } from "@/store/userStore";

type HeaderProps = {
  title: string;
};

const Header = ({ title }: HeaderProps) => {
  const { avatarUri } = useUserStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <TouchableOpacity
        onPress={() => router.push("/editprofile" as any)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: avatarUri ?? 'https://www.gravatar.com/avatar/?d=mp&s=200' }}
          style={styles.avatar}
        />
      </TouchableOpacity>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#E8F5E9",
  },
});