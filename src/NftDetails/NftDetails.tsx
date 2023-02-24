import {RouteProp, useRoute} from '@react-navigation/native'
import React, {ReactNode, useState} from 'react'
import {defineMessages, useIntl} from 'react-intl'
import {Image, StyleSheet, TouchableOpacity, View} from 'react-native'
import {ScrollView} from 'react-native-gesture-handler'

import {CopyButton, FadeIn, Icon, Link, Spacer, Text} from '../components'
import {Tab, TabPanel, TabPanels, Tabs} from '../components/Tabs'
import {useNft} from '../hooks'
import {NftRoutes} from '../navigation'
import {useModeratedNftImage} from '../Nfts/hooks'
import {useNavigateTo} from '../Nfts/navigation'
import {useSelectedWallet} from '../SelectedWallet'
import {COLORS} from '../theme'
import {isArray, isString} from '../yoroi-wallets'
import {YoroiNft} from '../yoroi-wallets/types'
import placeholder from './../assets/img/nft-placeholder.png'

type ViewTabs = 'overview' | 'metadata'

export const NftDetails = () => {
  const {id} = useRoute<RouteProp<NftRoutes, 'nft-details'>>().params
  const strings = useStrings()
  const wallet = useSelectedWallet()

  const [activeTab, setActiveTab] = useState<ViewTabs>('overview')
  const nft = useNft(wallet, {id})
  const {moderationStatus} = useModeratedNftImage({wallet, fingerprint: nft.fingerprint})
  const navigateTo = useNavigateTo()

  const canShowNft = moderationStatus === 'approved' || moderationStatus === 'consent'

  const stringifiedMetadata = JSON.stringify(nft, undefined, 2)

  const navigateToImageZoom = () => navigateTo.nftZoom(id)

  return (
    <FadeIn style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.imageContainer}>
          <TouchableOpacity onPress={navigateToImageZoom} disabled={!canShowNft} style={styles.imageWrapper}>
            <Image source={canShowNft ? {uri: nft.image} : placeholder} style={styles.image} resizeMode="contain" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabsContainer}>
          <Tabs>
            <Tab
              onPress={() => setActiveTab('overview')}
              label={strings.overview}
              active={activeTab === 'overview'}
              testID="overview"
            />

            <Tab
              onPress={() => setActiveTab('metadata')}
              label={strings.metadata}
              active={activeTab === 'metadata'}
              testID="metadata"
            />
          </Tabs>

          <TabPanels>
            <TabPanel active={activeTab === 'overview'}>
              <NftMetadataPanel nft={nft} />
            </TabPanel>

            <TabPanel active={activeTab === 'metadata'}>
              <View style={styles.copyMetadata}>
                <CopyButton value={stringifiedMetadata} style={styles.copyButton}>
                  <Text style={styles.copyText}>{strings.copyMetadata}</Text>
                </CopyButton>
              </View>

              <Spacer height={14} />

              <Text>{stringifiedMetadata}</Text>
            </TabPanel>
          </TabPanels>
        </View>
      </ScrollView>
    </FadeIn>
  )
}

const MetadataRow = ({title, copyText, children}: {title: string; children: ReactNode; copyText?: string}) => {
  return (
    <View style={styles.rowContainer}>
      <View style={styles.rowTitleContainer}>
        <Text>{title}</Text>

        {copyText !== undefined ? <CopyButton value={copyText} /> : null}
      </View>

      <Spacer height={2} />

      {children}
    </View>
  )
}

const NftMetadataPanel = ({nft}: {nft: YoroiNft}) => {
  const strings = useStrings()
  const metadataKeys = Object.keys(nft.metadata.originalMetadata)
  const metadataKeysToDisplay = metadataKeys.filter((key) => key !== 'name' && key !== 'description')

  return (
    <>
      <MetadataValue value={nft.name} label={strings.nftName} allowCopy={false} />

      <MetadataValue value={nft.description} label={strings.description} allowCopy={false} />

      <MetadataValue label={strings.fingerprint} value={nft.fingerprint} allowCopy={true} />

      <MetadataValue label={strings.policyId} value={nft.metadata.policyId} allowCopy={true} />

      {metadataKeysToDisplay.map((key) => {
        const value = nft.metadata.originalMetadata[key]
        if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean' ||
          (isArray(value) && value.every(isString))
        ) {
          return <MetadataValue key={key} label={key} value={value} allowCopy={true} />
        }

        return null
      })}

      <MetadataRow title={strings.detailsLinks}>
        <Link url={`https://cardanoscan.io/token/${nft.fingerprint}`}>
          <View style={styles.linkContent}>
            <Icon.ExternalLink size={12} color={COLORS.SHELLEY_BLUE} />

            <Spacer width={2} />

            <Text style={styles.linkText}>Cardanoscan</Text>
          </View>
        </Link>

        <Link url={`https://cexplorer.io/asset/${nft.fingerprint}`}>
          <View style={styles.linkContent}>
            <Icon.ExternalLink size={12} color={COLORS.SHELLEY_BLUE} />

            <Spacer width={2} />

            <Text style={styles.linkText}>Cexplorer</Text>
          </View>
        </Link>
      </MetadataRow>
    </>
  )
}

function MetadataValue({
  label,
  value,
  allowCopy,
}: {
  label: string
  value: string | number | boolean | string[]
  allowCopy: boolean
}) {
  if (typeof value === 'boolean') {
    const stringifiedValue = value ? 'Yes' : 'No'
    return (
      <MetadataRow title={label} copyText={allowCopy ? stringifiedValue : undefined}>
        <Text secondary>{stringifiedValue}</Text>
      </MetadataRow>
    )
  }

  if (typeof value === 'number') {
    const stringifiedValue = value.toString()
    return (
      <MetadataRow title={label} copyText={allowCopy ? stringifiedValue : undefined}>
        <Text secondary>{stringifiedValue}</Text>
      </MetadataRow>
    )
  }

  if (isArray(value) && value.every(isString)) {
    const stringifiedValue = value.join(', ')
    return (
      <MetadataRow title={label} copyText={allowCopy ? stringifiedValue : undefined}>
        <Text secondary>{stringifiedValue}</Text>
      </MetadataRow>
    )
  }

  return (
    <MetadataRow title={label} copyText={allowCopy ? value : undefined}>
      <Text secondary>{value}</Text>
    </MetadataRow>
  )
}

const styles = StyleSheet.create({
  copyButton: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  linkContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  linkText: {
    flex: 1,
    fontWeight: 'bold',
    textDecorationLine: 'none',
    color: COLORS.SHELLEY_BLUE,
  },
  copyText: {
    fontWeight: 'bold',
    color: '#242838',
    textTransform: 'uppercase',
  },
  container: {
    flex: 1,
  },
  imageContainer: {
    flex: 1,
  },
  image: {
    flex: 1,
    height: 380,
    flexGrow: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  tabsContainer: {flex: 1},
  rowContainer: {
    paddingVertical: 17,
    borderBottomWidth: 1,
    borderColor: 'rgba(173, 174, 182, 0.3)',
  },
  rowTitleContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
  },
  copyMetadata: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageWrapper: {
    display: 'flex',
    flexDirection: 'row',
  },
})

const messages = defineMessages({
  title: {
    id: 'nft.detail.title',
    defaultMessage: '!!!NFT Details',
  },
  overview: {
    id: 'nft.detail.overview',
    defaultMessage: '!!!Overview',
  },
  metadata: {
    id: 'nft.detail.metadata',
    defaultMessage: '!!!Metadata',
  },
  nftName: {
    id: 'nft.detail.nftName',
    defaultMessage: '!!!NFT Name',
  },
  createdAt: {
    id: 'nft.detail.createdAt',
    defaultMessage: '!!!Created',
  },
  description: {
    id: 'nft.detail.description',
    defaultMessage: '!!!Description',
  },
  author: {
    id: 'nft.detail.author',
    defaultMessage: '!!!Author',
  },
  fingerprint: {
    id: 'nft.detail.fingerprint',
    defaultMessage: '!!!Fingerprint',
  },
  policyId: {
    id: 'nft.detail.policyId',
    defaultMessage: '!!!Policy id',
  },
  detailsLinks: {
    id: 'nft.detail.detailsLinks',
    defaultMessage: '!!!Details on',
  },
  copyMetadata: {
    id: 'nft.detail.copyMetadata',
    defaultMessage: '!!!Copy metadata',
  },
})

const useStrings = () => {
  const intl = useIntl()

  return {
    title: intl.formatMessage(messages.title),
    overview: intl.formatMessage(messages.overview),
    metadata: intl.formatMessage(messages.metadata),
    nftName: intl.formatMessage(messages.nftName),
    createdAt: intl.formatMessage(messages.createdAt),
    description: intl.formatMessage(messages.description),
    author: intl.formatMessage(messages.author),
    fingerprint: intl.formatMessage(messages.fingerprint),
    policyId: intl.formatMessage(messages.policyId),
    detailsLinks: intl.formatMessage(messages.detailsLinks),
    copyMetadata: intl.formatMessage(messages.copyMetadata),
  }
}
