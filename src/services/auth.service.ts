import { appStateRepository, userRepository } from "../repositories";
import type { User } from "../types";
import { uid } from "../utils/formatDate";

const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
async function hash(pin: string, salt: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: 120_000 }, key, 256));
}
export const authService = {
  async load() {
    const user = (await userRepository.get()) ?? null;
    const session = await appStateRepository.get<{ userId: string }>("session");
    return { user, loggedIn: !!user && session?.userId === user.id };
  },
  async createProfile(name: string, pin?: string): Promise<User> {
    const now = new Date().toISOString();
    const salt = uid();
    const user: User = { id: uid(), name: name.trim(), createdAt: now, updatedAt: now, ...(pin ? { salt, passwordHash: await hash(pin, salt) } : {}) };
    await userRepository.put(user);
    await appStateRepository.set("session", { userId: user.id });
    return user;
  },
  async login(user: User, pin?: string) {
    if (user.passwordHash && (await hash(pin ?? "", user.salt ?? "")) !== user.passwordHash) throw new Error("Incorrect PIN.");
    await appStateRepository.set("session", { userId: user.id });
  },
  logout: () => appStateRepository.delete("session"),
};
