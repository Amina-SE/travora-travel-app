// Social sign-in keys. Fill these in after creating OAuth clients in Google Cloud Console.
// See README.md, "Google and Apple sign-in", for the exact steps.
export const AUTH = {
  // Where the Google / Apple buttons send people when in-app sign-in isn't available on this device.
  links: {
    google: 'https://accounts.google.com/',
    apple: 'https://appleid.apple.com/sign-in',
  },
  // Web client ID (type "Web application"). Required for Google sign-in on Android and iOS.
  googleWebClientId: '',
  // iOS client ID (type "iOS", bundle ID com.travora.app). Required for Google sign-in on iPhone.
  googleIosClientId: '',
};
