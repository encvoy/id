export const getAccessToken = (): string => {
  const accessToken = localStorage.getItem("accessToken");
  if (accessToken) return accessToken;
  return "";
};

export const logout = async (): Promise<void> => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("expiresIn");

  window.location.href = window.location.origin;
};
