import {useNetInfo} from '@react-native-community/netinfo';
import React, {useEffect, useState} from 'react';
import {useColorScheme} from 'react-native';
import Orientation from 'react-native-orientation';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {getColorScheme, scale, updateSize} from './src/common/common';
import {useTracked} from './src/provider';
import {ACTIONS} from './src/provider/actions';
import {defaultState} from './src/provider/defaultState';
import {eSubscribeEvent, eUnSubscribeEvent} from './src/services/eventManager';
import {eDispatchAction, eResetApp, eStartSyncer} from './src/services/events';
import {MMKV} from './src/utils/storage';
import {db, DDS, ToastEvent} from './src/utils/utils';

const App = () => {
  const [, dispatch] = useTracked();
  const [init, setInit] = useState(false);
  const netInfo = useNetInfo();
  const colorScheme = useColorScheme();
  const I = DDS.isTab ? require('./index.tablet') : require('./index.mobile');
  const _onOrientationChange = (o) => {
    // Currently orientation is locked on tablet.
    /* DDS.checkOrientation();
    setTimeout(() => {
      forceUpdate();
    }, 1000); */
  };

  useEffect(() => {
    updateTheme();
  }, [colorScheme]);

  const updateTheme = async () => {
    let settings;
    try {
      settings = await MMKV.getStringAsync('settings');
    } catch (e) {
      console.log(e.message);
    } finally {
      if (!settings) {
        return;
      }
      settings = JSON.parse(settings);
      if (settings.useSystemTheme) {
        let newColors = await getColorScheme(settings.useSystemTheme);
        dispatch({type: ACTIONS.THEME, colors: newColors});
      }
    }
  };

  useEffect(() => {
    if (!netInfo.isConnected || !netInfo.isInternetReachable) {
      db.user?.get().then((user) => {
        if (user) {
          ToastEvent.show('No internet connection', 'error');
        } else {
        }
      });
    } else {
      db.user?.get().then((user) => {
        if (user) {
          ToastEvent.show('Internet connection restored', 'success');
        } else {
        }
      });
    }
  }, [netInfo]);

  const startSyncer = async () => {
    try {
      let user = await db.user.get();
      if (user) {
        db.ev.subscribe('db:refresh', syncChanges);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const syncChanges = async () => {
    dispatch({type: ACTIONS.ALL});
  };

  const resetApp = () => {
    setInit(false);
    Initialize().then(() => {
      setInit(true);
    });
  };

  useEffect(() => {
    DDS.isTab ? Orientation.lockToLandscape() : Orientation.lockToPortrait();
    eSubscribeEvent(eStartSyncer, startSyncer);
    eSubscribeEvent(eResetApp, resetApp);
    Orientation.addOrientationListener(_onOrientationChange);
    eSubscribeEvent(eDispatchAction, (type) => {
      dispatch(type);
    });
    return () => {
      db?.ev?.unsubscribe('db:refresh', syncChanges);
      eUnSubscribeEvent(eStartSyncer, startSyncer);
      eUnSubscribeEvent(eResetApp, resetApp);
      eUnSubscribeEvent(eDispatchAction, (type) => {
        dispatch(type);
      });
      Orientation.removeOrientationListener(_onOrientationChange);
    };
  }, []);

  useEffect(() => {
    let error = null;
    let user;
    Initialize().finally(async () => {
      try {
        await db.init();
        user = await db.user.get();
      } catch (e) {
        error = e;
      } finally {
        if (user) {
          dispatch({type: ACTIONS.USER, user: user});
          startSyncer();
        }
        dispatch({type: ACTIONS.ALL});
        setInit(true);
        if (error) {
          setTimeout(() => {
            ToastEvent.show(error.message);
          }, 500);
        }
      }
    });
  }, []);

  async function Initialize(colors = colors) {
    let settings;
    scale.fontScale = 1;
    try {
      settings = await MMKV.getStringAsync('settings');
      settings = JSON.parse(settings);

      if (settings.fontScale) {
        scale.fontScale = settings.fontScale;
      }
      updateSize();
    } catch (e) {
      if (!settings || !settings.includes('fontScale')) {
        settings = defaultState.settings;
        await MMKV.setStringAsync('settings', JSON.stringify(settings));
      }
    } finally {
      let newColors = await getColorScheme(settings.useSystemTheme);
      dispatch({type: ACTIONS.SETTINGS, settings: {...settings}});
      dispatch({type: ACTIONS.THEME, colors: newColors});
    }
  }

  if (!init) {
    return <></>;
  }
  return (
    <>
      <SafeAreaProvider>
        <>
          <I.Initialize />
        </>
      </SafeAreaProvider>
    </>
  );
};

export default App;
