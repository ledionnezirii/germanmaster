import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from "@expo-google-fonts/nunito";

// Font family name constants — import F in any screen and use in StyleSheet
export const F = {
  regular: "Nunito_400Regular",   // body text, descriptions, captions
  semi:    "Nunito_600SemiBold",  // small labels, secondary info
  bold:    "Nunito_700Bold",      // card labels, progress text, buttons
  xbold:   "Nunito_800ExtraBold", // section headers, badge text, card titles
  black:   "Nunito_900Black",     // big numbers, main headings, names
};

// Call once at the app root — all screens share the loaded fonts
export function useAppFonts() {
  return useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });
}
