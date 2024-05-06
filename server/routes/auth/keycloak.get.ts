export default oauth.keycloakEventHandler({
  async onSuccess(event, { user, tokens }) {
    console.log(user);
    console.log(event);
    await setUserSession(event, user);
    // return sendRedirect(event, "/");
  }
});
