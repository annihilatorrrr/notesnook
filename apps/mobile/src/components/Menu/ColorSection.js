import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import { useMenuStore, useNoteStore } from '../../provider/stores';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import {getElevation} from '../../utils';
import {COLORS_NOTE} from '../../utils/Colors';
import {refreshNotesPage} from '../../utils/Events';
import {normalize, SIZE} from '../../utils/SizeUtils';
import {PressableButton} from '../PressableButton';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

export const ColorSection = () => {
  const colorNotes = useMenuStore(state => state.colorNotes);
  const loading = useNoteStore(state => state.loading);
  const setColorNotes = useMenuStore(state => state.setColorNotes);

  useEffect(() => {
    if (!loading) {
      setColorNotes();
    }
  }, [loading]);
  

  return colorNotes.map((item, index) => (
    <ColorItem key={item.id} item={item} index={index} />
  ));
};

const ColorItem = ({item, index}) => {
  const [state] = useTracked();
  const {colors} = state;
  const [headerTextState, setHeaderTextState] = useState(null);

  const onHeaderStateChange = (event) => {
      if (event?.id === item.id) {
         setHeaderTextState(event);
      } else {
        setHeaderTextState(null);
      }

  };

  useEffect(() => {
    eSubscribeEvent('onHeaderStateChange', onHeaderStateChange);
    return () => {
      eUnSubscribeEvent('onHeaderStateChange', onHeaderStateChange);
    };
  }, []);

  const onPress = (item) => {
    let params = {
      ...item,
      type: 'color',
      menu: true,
      get:'colored'
    };
    Navigation.navigate('NotesPage', params, {
      heading: item.title.slice(0, 1).toUpperCase() + item.title.slice(1),
      id: item.id,
      type: 'color',
    });
    eSendEvent(refreshNotesPage, params);
    Navigation.closeDrawer();
  };

  return (
    <PressableButton
      customColor="transparent"
      customSelectedColor={COLORS_NOTE[item.title]}
      customAlpha={!colors.night ? -0.02 : 0.02}
      customOpacity={0.12}
      onPress={() => onPress(item)}
      customStyle={{
        width: '100%',
        alignSelf: 'center',
        borderRadius: 0,
        flexDirection: 'row',
        paddingHorizontal: 8,
        justifyContent: 'space-between',
        alignItems: 'center',
        height: normalize(50),
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <View
          style={{
            width: 30,
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}>
          <View
            style={{
              width: SIZE.lg - 2,
              height: SIZE.lg - 2, 
              backgroundColor: COLORS_NOTE[item.title],
              borderRadius: 100,
              justifyContent: 'center',
              marginRight: 10,
            }}
          />
        </View>
        {headerTextState?.id === item.id ? (
          <Heading color={COLORS_NOTE[item.title.toLowerCase()]} size={SIZE.md}>
            {item.title.slice(0, 1).toUpperCase() + item.title.slice(1)}
          </Heading>
        ) : (
          <Paragraph color={colors.heading} size={SIZE.md}>
            {item.title.slice(0, 1).toUpperCase() + item.title.slice(1)}
          </Paragraph>
        )}
      </View>

      <View
        style={{
          backgroundColor:
            headerTextState?.id === item.id
              ? COLORS_NOTE[item.title.toLowerCase()]
              : 'transparent',
          width: 7,
          height: 7,
          borderRadius: 100,
          ...getElevation(
            headerTextState?.id === item.id + '_navigation' ? 1 : 0,
          ),
        }}
      />
    </PressableButton>
  );
};
