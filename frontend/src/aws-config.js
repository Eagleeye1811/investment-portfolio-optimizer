import { Amplify } from 'aws-amplify';

// Check if required environment variables are present
const hasRequiredConfig = 
  import.meta.env.VITE_USER_POOL_ID && 
  import.meta.env.VITE_USER_POOL_CLIENT_ID;

// Configure AWS services only if required config exists
if (hasRequiredConfig) {
  console.log('Configuring Amplify with Cognito settings');
  Amplify.configure({
    // Auth configuration
    Auth: {
      region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
      userPoolId: import.meta.env.VITE_USER_POOL_ID,
      userPoolWebClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
      mandatorySignIn: true,
    },
    // API Gateway configuration
    API: {
      endpoints: [
        {
          name: 'portfolioOptimizerApi',
          endpoint: import.meta.env.VITE_API_ENDPOINT,
          region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
        }
      ]
    }
  });
} else {
  console.warn('AWS Amplify configuration incomplete. Authentication features will not work.');
}
