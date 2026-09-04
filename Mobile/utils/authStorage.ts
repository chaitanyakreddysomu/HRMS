import AsyncStorage from "@react-native-async-storage/async-storage";

export interface AuthSession {
  token?: string;
  refreshToken?: string;
  user: {
    id?: string;
    name: string;
    role: string;
    email?: string;
  };
}

const AUTH_KEY = "@hrms_auth_session";

export const saveAuthSession = async (session: AuthSession) => {
  try {
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(session));
  } catch (error) {
    console.error("Error saving auth session:", error);
  }
};

export const getAuthSession = async (): Promise<AuthSession | null> => {
  try {
    const data = await AsyncStorage.getItem(AUTH_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error reading auth session:", error);
    return null;
  }
};

export const clearAuthSession = async () => {
  try {
    await AsyncStorage.removeItem(AUTH_KEY);
  } catch (error) {
    console.error("Error clearing auth session:", error);
  }
};
