import React from 'react';
import {View} from 'react-native';
import {useTracked} from '../../provider';
import {SIZE} from '../../utils/SizeUtils';
import {Button} from '../Button';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

const DialogHeader = ({icon, title, paragraph, button, paragraphColor}) => {
  const [state, dispatch] = useTracked();
  const colors = state.colors;

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 50,
        }}>
        <View
          style={{
            width: '100%',
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <Heading size={SIZE.xl}>{title}</Heading>

            {button && (
              <Button
                onPress={button.onPress}
                style={{
                  borderRadius: 100,
                }}
                fontSize={13}
                title={button.title}
                type="accent"
                height={25}
              />
            )}
          </View>

          {paragraph ? (
            <Paragraph color={paragraphColor || colors.icon}>
              {paragraph}
            </Paragraph>
          ) : null}
        </View>
      </View>
    </>
  );
};

export default DialogHeader;
