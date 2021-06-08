import React, {useEffect, useState} from 'react';
import {Linking, Platform, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import BaseDialog from '../../components/Dialog/base-dialog';
import {useTracked} from '../../provider';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
import {getElevation} from '../../utils';
import {eCloseRateDialog, eOpenRateDialog} from '../../utils/Events';
import {MMKV} from '../../utils/mmkv';
import {SIZE} from '../../utils/SizeUtils';
import {Button} from '../Button';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

const RateDialog = () => {
  const [state] = useTracked();
  const {colors} = state;
  const [visible, setVisible] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    eSubscribeEvent(eOpenRateDialog, open);
    eSubscribeEvent(eCloseRateDialog, close);

    return () => {
      eUnSubscribeEvent(eOpenRateDialog, open);
      eUnSubscribeEvent(eCloseRateDialog, close);
    };
  }, []);

  const open = () => {
    setVisible(true);
  };

  const close = () => {
    setVisible(false);
  };

  return !visible ? null : (
    <BaseDialog
      centered={false}
      onRequestClose={async () => {
        await MMKV.setItem(
          'askForRating',
          JSON.stringify({
            timestamp: Date.now() + 86400000 * 2,
          }),
        );
        setVisible(false);
      }}
      visible={true}>
      <View
        style={{
          ...getElevation(5),
          width: '100%',
          backgroundColor: colors.accent,
          zIndex: 100,
          bottom: 20,
          alignSelf: 'center',
          padding: 12,
          paddingTop: insets.top + 25,
        }}>
        <Heading color={colors.light}>Rate Notesnook</Heading>
        <Paragraph size={SIZE.md} color={colors.light}>
          It took us a year to bring Notesnook to life, the best private note
          taking app. It will take you a moment to rate it to let us know what
          you think!
        </Paragraph>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingTop: 20,
          }}>
          <Button
            onPress={async () => {
              await MMKV.setItem('askForRating', 'never');
              setVisible(false);
            }}
            fontSize={SIZE.md}
            type="white"
            title="Never"
          />
          <Button
            onPress={async () => {
              await MMKV.setItem(
                'askForRating',
                JSON.stringify({
                  timestamp: Date.now() + 86400000 * 2,
                }),
              );
              setVisible(false);
            }}
            fontSize={SIZE.md}
            type="white"
            title="Later"
          />
          <Button
            onPress={async () => {
              await Linking.openURL(
                Platform.OS === 'ios'
                  ? 'https://bit.ly/notesnook-ios'
                  : 'https://bit.ly/notesnook-and',
              );

              await MMKV.setItem('askForRating', 'completed');
              setVisible(false);
            }}
            fontSize={SIZE.md}
            type="white"
            title="Rate now"
          />
        </View>
      </View>
    </BaseDialog>
  );
};

export default RateDialog;
