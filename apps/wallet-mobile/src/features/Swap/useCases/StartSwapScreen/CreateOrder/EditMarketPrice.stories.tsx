import {storiesOf} from '@storybook/react-native'
import React from 'react'
import {StyleSheet, View} from 'react-native'

import {EditMarketPrice} from './EditMarketPrice'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
})

storiesOf('Swap Edit Market Price', module)
  .addDecorator((story) => <View style={styles.container}>{story()}</View>)
  .add('inital', () => <EditMarketPrice />)
  .add('disabled', () => <EditMarketPrice disabled />)
