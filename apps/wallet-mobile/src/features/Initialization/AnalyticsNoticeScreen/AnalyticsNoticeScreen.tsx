import * as React from 'react'
import {StyleSheet} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'

import {Analytics, StatusBar} from '../../../components'
import {useAgreeWithLegal, useNavigateTo} from '../common'

export const AnalyticsNoticeScreen = () => {
  const navigateTo = useNavigateTo()
  const {agree} = useAgreeWithLegal()

  const onClose = () => {
    agree()
    navigateTo.enableLogingWithPin()
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar type="dark" />

      <Analytics type="notice" onClose={onClose} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
})