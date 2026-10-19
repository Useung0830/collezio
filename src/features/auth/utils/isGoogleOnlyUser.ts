type AuthProviders = { providerData: { providerId: string }[] };

export function isGoogleOnlyUser(user: AuthProviders | null) {
  return Boolean(
    user?.providerData.some(({ providerId }) => providerId === "google.com") &&
    !user.providerData.some(({ providerId }) => providerId === "password"),
  );
}
