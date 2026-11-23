import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Syne_600SemiBold, Syne_700Bold, Syne_800ExtraBold } from '@expo-google-fonts/syne';
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { StoreProvider } from './src/store';
import { Navigator } from './src/nav';
import { C } from './src/theme';
import { SplashScreen as Splash, OnboardingScreen } from './src/screens/IntroScreens';
import { SignInScreen, SignUpScreen } from './src/screens/AuthScreens';
import MainScreen from './src/screens/MainScreens';
import { SearchScreen, ResultsScreen } from './src/screens/SearchScreens';
import CabinScreen from './src/screens/CabinScreen';
import { HotelScreen, RoomScreen } from './src/screens/HotelScreens';
import CarScreen from './src/screens/CarScreen';
import { CheckoutScreen, BillingScreen, AddCardScreen, PaymentMethodsScreen, SuccessScreen } from './src/screens/PaymentScreens';
import { TicketScreen, EditProfileScreen, HelpScreen } from './src/screens/TicketScreens';
import WalkthroughScreen from './src/screens/WalkthroughScreen';

SplashScreen.preventAutoHideAsync().catch(() => {});

const SCREENS = {
  Splash: { component: Splash, transition: 'fade' },
  Onboarding: { component: OnboardingScreen, transition: 'fade' },
  SignIn: { component: SignInScreen, transition: 'fade' },
  SignUp: { component: SignUpScreen },
  Main: { component: MainScreen, transition: 'fade' },
  Search: { component: SearchScreen },
  Results: { component: ResultsScreen },
  Cabin: { component: CabinScreen, transition: 'zoom' },
  Hotel: { component: HotelScreen, transition: 'zoom' },
  Room: { component: RoomScreen, transition: 'zoom' },
  Cars: { component: CarScreen },
  Checkout: { component: CheckoutScreen, transition: 'rise' },
  Billing: { component: BillingScreen },
  AddCard: { component: AddCardScreen, transition: 'rise' },
  PaymentMethods: { component: PaymentMethodsScreen },
  Success: { component: SuccessScreen, transition: 'fade' },
  Ticket: { component: TicketScreen, transition: 'zoom' },
  EditProfile: { component: EditProfileScreen },
  Help: { component: HelpScreen },
  Walkthrough: { component: WalkthroughScreen, transition: 'zoom' },
};

export default function App() {
  const [loaded, error] = useFonts({
    Syne_600SemiBold, Syne_700Bold, Syne_800ExtraBold,
    Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold,
  });
  const ready = loaded || !!error;
  const onLayout = useCallback(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);
  useEffect(() => { if (ready) SplashScreen.hideAsync().catch(() => {}); }, [ready]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: C.night }} />;
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <View style={{ flex: 1, backgroundColor: C.night }} onLayout={onLayout}>
          <StatusBar style="light" />
          <Navigator screens={SCREENS} initial="Splash" />
        </View>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
