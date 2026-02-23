export const getAuthUser = () => {
  try {
    const token = localStorage.getItem("token");
    const rawUser = localStorage.getItem("user");

    if (!token || !rawUser) return null;

    const user = JSON.parse(rawUser);

    return {
      token,
      user,
      role: user?.role?.toLowerCase() || null,
    };
  } catch {
    return null;
  }
};
