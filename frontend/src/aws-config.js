import { Amplify } from 'aws-amplify';

// Check if required environment variables are present
const hasRequiredConfig = 
  import.meta.env.VITE_USER_POOL_ID && 
  import.meta.env.VITE_USER_POOL_CLIENT_ID;

// Configure AWS services only if required config exists
if (hasRequiredConfig) {
  console.log('✅ Configuring Amplify with Cognito settings');
  
  const amplifyConfig = {
    Auth: {
      Cognito: {
        userPoolId: import.meta.env.VITE_USER_POOL_ID,
        userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
        loginWith: {
          email: true,
          username: true
        },
        signUpVerificationMethod: 'code',
        userAttributes: {
          email: {
            required: true
          }
        },
        passwordFormat: {
          minLength: 8,
          requireLowercase: true,
          requireUppercase: true,
          requireNumbers: true,
          requireSpecialCharacters: false
        }
      }
    }
  };

  // Add API configuration if endpoint is provided
  if (import.meta.env.VITE_API_ENDPOINT) {
    amplifyConfig.API = {
      REST: {
        portfolioOptimizerApi: {
          endpoint: import.meta.env.VITE_API_ENDPOINT,
          region: import.meta.env.VITE_AWS_REGION || 'us-east-1'
        }
      }
    };
  }

  Amplify.configure(amplifyConfig);
  console.log('✅ Amplify configured successfully');
} else {
  console.warn('⚠️ AWS Amplify configuration incomplete. Add VITE_USER_POOL_ID and VITE_USER_POOL_CLIENT_ID to .env');
}

export default Amplify;