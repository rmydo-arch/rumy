export const paths = {
  gallery: "/",
  photo: (id: string) => `/k/${id}/foto`,
  editor: (id: string) => `/k/${id}/stil`,
  result: (id: string) => `/k/${id}/sonuc`,
  privacy: "/gizlilik",
  account: "/hesap",
} as const;
