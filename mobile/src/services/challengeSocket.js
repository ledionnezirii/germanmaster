import { io } from "socket.io-client";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { SOCKET_URL } from "./api";

let _socket = null;

async function getToken() {
  if (Platform.OS === "web") return localStorage.getItem("authToken");
  return SecureStore.getItemAsync("authToken");
}

export async function connectChallengeSocket() {
  if (_socket?.connected) return _socket;
  if (_socket) { _socket.disconnect(); _socket = null; }

  const token = await getToken();
  _socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
    reconnection: false,
  });
  return _socket;
}

export function getChallengeSocket() { return _socket; }

export function disconnectChallengeSocket() {
  if (_socket) { _socket.disconnect(); _socket = null; }
}
