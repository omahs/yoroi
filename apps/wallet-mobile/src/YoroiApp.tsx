/* eslint-disable @typescript-eslint/no-explicit-any */
import {getMetricsFactory, makeMetricsStorage, MetricsProvider} from '@yoroi/metrics-react-native'
import * as SplashScreen from 'expo-splash-screen'
import Lottie from 'lottie-react-native'
import React from 'react'
import {Animated, LogBox, Platform, StyleSheet, UIManager, View} from 'react-native'
import Config from 'react-native-config'
import * as RNP from 'react-native-paper'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {enableScreens} from 'react-native-screens'
import {QueryClient, QueryClientProvider} from 'react-query'

import {AuthProvider} from './auth/AuthProvider'
import {LoadingBoundary} from './components'
import {ErrorBoundary} from './components/ErrorBoundary'
import {features} from './features'
import {LanguageProvider} from './i18n'
import {InitApp} from './InitApp'
import {CONFIG} from './legacy/config'
import {setLogLevel} from './legacy/logging'
import {SelectedWalletMetaProvider, SelectedWalletProvider} from './SelectedWallet/Context'
import {CurrencyProvider} from './Settings/Currency/CurrencyContext'
import {ThemeProvider} from './theme'
import {WalletManagerProvider} from './WalletManager'
import {useMigrations} from './yoroi-wallets/migrations'
import {storage, StorageProvider} from './yoroi-wallets/storage'
import {walletManager} from './yoroi-wallets/walletManager'

enableScreens()

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental != null) {
    UIManager.setLayoutAnimationEnabledExperimental(true)
  }
}

SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
})

setLogLevel(CONFIG.LOG_LEVEL)

// eslint-disable-next-line no-extra-boolean-cast
if (Boolean(Config.DISABLE_LOGBOX)) LogBox.ignoreAllLogs()

const queryClient = new QueryClient()
const amplitudeClient = getMetricsFactory(features.analytics ? 'amplitude' : 'mock')({
  apiKey: '',
})
const metricsStorage = makeMetricsStorage()

export const YoroiApp = () => {
  const migrated = useMigrations(storage)

  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  return migrated ? (
    <AnimatedSplashScreen>
      <StorageProvider>
        <MetricsProvider metrics={amplitudeClient} storage={metricsStorage}>
          <WalletManagerProvider walletManager={walletManager}>
            <ErrorBoundary>
              <QueryClientProvider client={queryClient}>
                <LoadingBoundary style={StyleSheet.absoluteFill}>
                  <ThemeProvider>
                    <LanguageProvider>
                      <CurrencyProvider>
                        <SafeAreaProvider>
                          <RNP.Provider>
                            <AuthProvider>
                              <SelectedWalletMetaProvider>
                                <SelectedWalletProvider>
                                  <InitApp />
                                </SelectedWalletProvider>
                              </SelectedWalletMetaProvider>
                            </AuthProvider>
                          </RNP.Provider>
                        </SafeAreaProvider>
                      </CurrencyProvider>
                    </LanguageProvider>
                  </ThemeProvider>
                </LoadingBoundary>
              </QueryClientProvider>
            </ErrorBoundary>
          </WalletManagerProvider>
        </MetricsProvider>
      </StorageProvider>
    </AnimatedSplashScreen>
  ) : null
}

function AnimatedSplashScreen({children}) {
  const animation = React.useMemo(() => new Animated.Value(1), [])
  const [isAppReady, setAppReady] = React.useState(false)
  const [isAnimationComplete, setAnimationComplete] = React.useState(false)

  React.useEffect(() => {
    if (isAppReady) {
      Animated.timing(animation, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => setAnimationComplete(true))
    }
  }, [isAppReady, animation])

  const onImageLoaded = React.useCallback(async () => {
    try {
      await SplashScreen.hideAsync()
    } catch (e) {
      //
    } finally {
      setAppReady(true)
    }
  }, [])

  return (
    <View style={{flex: 1}}>
      {isAppReady && children}

      {!isAnimationComplete && (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: 'blue',
            },
          ]}
        >
          <Lottie
            progress={animation}
            source={require('./assets/img/splashscreenlogo.json')}
            onAnimationFinish={onImageLoaded}
          />
        </View>
      )}
    </View>
  )
}
