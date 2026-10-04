// Testing and production share the Railway "production" environment, so the
// service name is what tells the testing deployment apart.
export const isTestingDeploy = () =>
  process.env.RAILWAY_SERVICE_NAME === "(Testing) FrontEnd";
