import React from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store/store';
import { RootGate } from './src/navigation/RootGate';
import { ThemeProvider } from './src/theme/ThemeContext';
import { ThemedStatusBar } from './src/components/ThemedStatusBar';
import { NotificationToast } from './src/components/NotificationToast';

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <ThemeProvider>
            <ThemedStatusBar />
            <View style={{ flex: 1 }}>
              <RootGate />
              <NotificationToast />
            </View>
          </ThemeProvider>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
