import {useNavigation} from '@react-navigation/native'
import {useRef} from 'react'

import {AppRouteNavigation, TxHistoryRouteNavigation, TxHistoryRoutes} from '../../../navigation'
import {useOverridePreviousRoute} from '../../../utils/navigation'

export const useNavigateTo = () => {
  const navigation = useNavigation<TxHistoryRouteNavigation & AppRouteNavigation>()

  return useRef({
    selectedTokens: () => navigation.navigate('send-list-amounts-to-send'),
    addToken: () => navigation.navigate('send-select-token-from-list'),
    startTx: () => navigation.navigate('send-start-tx'),
    confirmTx: () => navigation.navigate('send-confirm-tx'),
    editAmount: () => navigation.navigate('send-edit-amount'),
    reader: () => navigation.navigate('send-read-qr-code'),
    submittedTx: () => navigation.navigate('send-submitted-tx'),
    failedTx: () => navigation.navigate('send-failed-tx'),
    startTxAfterReset: () =>
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'app-root',
            state: {
              routes: [
                {name: 'wallet-selection'},
                {
                  name: 'main-wallet-routes',
                  state: {
                    routes: [
                      {
                        name: 'history',
                        state: {
                          routes: [{name: 'history-list'}, {name: 'send-start-tx'}],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      }),
  }).current
}

export const useOverridePreviousSendTxRoute = (routeName: keyof TxHistoryRoutes) => {
  useOverridePreviousRoute(routeName)
}
