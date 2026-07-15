export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Sends the user to the login/register screen (Home). Login itself happens
// there via trpc.auth.login / trpc.auth.register — this is just navigation.
export const redirectToLogin = () => {
  if (typeof window !== "undefined") {
    window.location.href = "/";
  }
};
