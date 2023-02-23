import {AddressType, Transaction} from '@cardano-foundation/ledgerjs-hw-app-cardano'
import {walletChecksum} from '@emurgo/cip4-js'
import {RegistrationStatus} from '@emurgo/yoroi-lib'
import BigNumber from 'bignumber.js'
import {assert} from 'chai'
import ExtendableError from 'es6-error'
import _ from 'lodash'
import DeviceInfo from 'react-native-device-info'
import {defaultMemoize} from 'reselect'

import {makeWalletEncryptedStorage, WalletEncryptedStorage} from '../../../../auth'
import {Keychain} from '../../../../auth/Keychain'
import {encryptWithPassword} from '../../../../Catalyst/catalystCipher'
import LocalizableError from '../../../../i18n/LocalizableError'
import {DISABLE_BACKGROUND_SYNC} from '../../../../legacy/config'
import {parseSafe, Quantities, validatePassword} from '../../..'
import {HWDeviceInfo} from '../../../hw'
import {MemosManager} from '../../../memos'
import {YoroiStorage} from '../../../storage'
import {
  AccountStateResponse,
  CurrencySymbol,
  FundInfoResponse,
  PoolInfoRequest,
  Quantity,
  RawUtxo,
  SendTokenList,
  StakingInfo,
  TipStatusResponse,
  TxStatusRequest,
  TxStatusResponse,
  YoroiSignedTx,
  YoroiUnsignedTx,
} from '../../../types'
import {NetworkInfo} from '../../../types/networkInfo'
import {networkInfo} from '../../mainnet/shelley/shared/networkInfo'
import {
  Cardano,
  CardanoMobile,
  CardanoTypes,
  generatePrivateKeyForCatalyst,
  generateWalletRootKey,
  NoOutputsError,
  NotEnoughMoneyToSendError,
  signTxWithLedger,
  WalletEvent,
  WalletSubscription,
  YoroiWallet,
} from '../../shared'
import {AddressChain, AddressChainJSON, Addresses, AddressGenerator} from '../../shared/chain/chain'
import {CardanoError, InvalidState} from '../../shared/errors'
import {processTxHistoryData} from '../../shared/processTransaction/processTransactions'
import {IsLockedError, nonblockingSynchronize, synchronize} from '../../shared/promise'
import {yoroiSignedTx} from '../../shared/signedTx'
import {TransactionManager} from '../../shared/transactionManager/transactionManager'
import {yoroiUnsignedTx} from '../../shared/unsignedTx'
import {UtxoManager} from '../../shared/utxoManager/utxoManager'
import {filterAddressesByStakingKey, getDelegationStatus} from '../../shelley/shared/delegationUtils'
import {deriveKeys, deriveStakingKey, formatPathCip1852} from '../../shelley/shared/util'
import {
  ACCOUNT_INDEX,
  ADDRESS_TYPE_TO_CHANGE,
  BACKEND,
  BIP44_DERIVATION_LEVELS,
  BYRON_BASE_CONFIG,
  CARDANO_HASKELL_CONFIG,
  CARDANO_HASKELL_SHELLEY_NETWORK,
  CHAIN_NETWORK_ID,
  CIP1852,
  COIN_TYPE,
  DISCOVERY_BLOCK_SIZE,
  DISCOVERY_GAP_SIZE,
  HARD_DERIVATION_START,
  HISTORY_REFRESH_TIME,
  IS_MAINNET,
  MAX_GENERATED_UNUSED,
  NETWORK_ID,
  primaryToken,
  primaryTokenInfo,
  REWARD_ADDRESS_ADDRESSING,
  STAKING_KEY_PATH,
  TOKEN_INFO_SERVICE,
  WALLET_IMPLEMENTATION_ID,
} from './constants'

type Capabilities = {
  registerToVote: boolean
  stake: boolean
  sign: boolean
  tokens: boolean
  nfts: boolean
}

export class ShelleyWallet implements YoroiWallet {
  readonly id: string
  readonly hwDeviceInfo: null | HWDeviceInfo
  readonly isHW: boolean
  readonly isReadOnly: boolean
  readonly internalChain: AddressChain
  readonly externalChain: AddressChain
  readonly publicKeyHex: string
  readonly rewardAddressHex: string
  readonly version: string
  readonly checksum: CardanoTypes.WalletChecksum
  readonly encryptedStorage: WalletEncryptedStorage
  readonly primaryTokenInfo = primaryTokenInfo
  readonly primaryToken = primaryToken
  isEasyConfirmationEnabled = false
  capabilities: Capabilities = {
    registerToVote: true,
    stake: true,
    sign: true,
    tokens: true,
    nfts: true,
  }

  formatPath: (account: number, addressType: AddressType, index: number) => string = formatPathCip1852

  private _utxos: RawUtxo[]
  private readonly storage: YoroiStorage
  private readonly utxoManager: UtxoManager
  private readonly transactionManager: TransactionManager
  private readonly memosManager: MemosManager
  readonly networkInfo: NetworkInfo = networkInfo

  constructor({
    storage,
    id,
    utxoManager,
    hwDeviceInfo,
    isReadOnly,
    accountPubKeyHex,
    rewardAddressHex,
    internalChain,
    externalChain,
    isEasyConfirmationEnabled,
    lastGeneratedAddressIndex,
    transactionManager,
    memosManager,
  }: {
    storage: YoroiStorage
    id: string
    utxoManager: UtxoManager
    hwDeviceInfo: HWDeviceInfo | null
    isReadOnly: boolean
    accountPubKeyHex: string
    rewardAddressHex: string
    internalChain: AddressChain
    externalChain: AddressChain
    isEasyConfirmationEnabled: boolean
    lastGeneratedAddressIndex: number
    transactionManager: TransactionManager
    memosManager: MemosManager
  }) {
    this.id = id
    this.storage = storage
    this.utxoManager = utxoManager
    this._utxos = utxoManager.initialUtxos
    this.encryptedStorage = makeWalletEncryptedStorage(id)
    this.isHW = hwDeviceInfo != null
    this.hwDeviceInfo = hwDeviceInfo
    this.isReadOnly = isReadOnly
    this.transactionManager = transactionManager
    this.memosManager = memosManager
    this.internalChain = internalChain
    this.externalChain = externalChain
    this.rewardAddressHex = rewardAddressHex
    this.publicKeyHex = accountPubKeyHex
    this.version = DeviceInfo.getVersion()
    this.checksum = walletChecksum(accountPubKeyHex)
    this.setupSubscriptions()
    this.notify({type: 'initialize'})
    this.isInitialized = true
    this.isEasyConfirmationEnabled = isEasyConfirmationEnabled
    this.state = {lastGeneratedAddressIndex}
  }

  timeout: NodeJS.Timeout | null = null

  startSync() {
    Logger.info(`starting wallet: ${this.id}`)

    const backgroundSync = async () => {
      try {
        await this.tryDoFullSync()
        await this.save()
      } catch (error) {
        Logger.error((error as Error)?.message)
      } finally {
        if (!DISABLE_BACKGROUND_SYNC && process.env.NODE_ENV !== 'test') {
          this.timeout = setTimeout(() => backgroundSync(), HISTORY_REFRESH_TIME)
        }
      }
    }

    backgroundSync()
  }

  stopSync() {
    if (!this.timeout) return
    Logger.info(`stopping wallet: ${this.id}`)
    clearTimeout(this.timeout)
  }

  get utxos() {
    return this._utxos
  }

  get receiveAddresses(): Addresses {
    return this.externalAddresses.slice(0, this.numReceiveAddresses)
  }

  save() {
    return this.storage.setItem('data', this.toJSON())
  }

  async clear() {
    await this.transactionManager.clear()
    await this.utxoManager.clear()
  }

  saveMemo(txId: string, memo: string): Promise<void> {
    return this.memosManager.saveMemo(txId, memo)
  }

  // =================== persistence =================== //

  private integrityCheck(): void {
    try {
      if (this.isHW) {
        assert.assert(this.hwDeviceInfo != null, 'no device info for hardware wallet')
      }
    } catch (e) {
      Logger.error('wallet::_integrityCheck', e)
      throw new InvalidState((e as Error).message)
    }
  }

  async sync() {
    await this.doFullSync()
    await this.save()
  }

  async resync() {
    await this.clear()
    this.transactionManager.resetState()
    await this.save()
    this.sync()
  }

  // =================== utils =================== //

  private getChangeAddress(): string {
    const candidateAddresses = this.internalChain.addresses
    const unseen = candidateAddresses.filter((addr) => !this.isUsedAddress(addr))
    assert.assert(unseen.length > 0, 'Cannot find change address')
    const changeAddress = _.first(unseen)
    if (!changeAddress) throw new Error('invalid wallet state')

    return changeAddress
  }

  private getAddressedChangeAddress(): Promise<{address: string; addressing: CardanoTypes.Addressing}> {
    const changeAddr = this.getChangeAddress()
    const addressing = this.getAddressing(changeAddr)

    return Promise.resolve({
      address: changeAddr,
      addressing,
    })
  }

  private async getStakingKey() {
    const stakingKey = await deriveStakingKey(this.publicKeyHex)
    Logger.info(`getStakingKey: ${Buffer.from(await stakingKey.asBytes()).toString('hex')}`)
    return stakingKey
  }

  private async getRewardAddress() {
    const stakingKey = await this.getStakingKey()
    const credential = await CardanoMobile.StakeCredential.fromKeyhash(await stakingKey.hash())
    const rewardAddr = await CardanoMobile.RewardAddress.new(CHAIN_NETWORK_ID, credential)
    return rewardAddr.toAddress()
  }

  async getAllUtxosForKey() {
    return filterAddressesByStakingKey(
      await CardanoMobile.StakeCredential.fromKeyhash(await (await this.getStakingKey()).hash()),
      await this.getAddressedUtxos(),
      false,
    )
  }

  private getAddressing(address: string) {
    if (this.internalChain.isMyAddress(address)) {
      return {
        path: [
          CIP1852,
          COIN_TYPE,
          ACCOUNT_INDEX + HARD_DERIVATION_START,
          ADDRESS_TYPE_TO_CHANGE['Internal'],
          this.internalChain.getIndexOfAddress(address),
        ],
        startLevel: BIP44_DERIVATION_LEVELS.PURPOSE,
      }
    }

    if (this.externalChain.isMyAddress(address)) {
      return {
        path: [
          CIP1852,
          COIN_TYPE,
          ACCOUNT_INDEX + HARD_DERIVATION_START,
          ADDRESS_TYPE_TO_CHANGE['External'],
          this.externalChain.getIndexOfAddress(address),
        ],
        startLevel: BIP44_DERIVATION_LEVELS.PURPOSE,
      }
    }

    throw new Error(`Missing address info for: ${address} `)
  }

  private getAddressedUtxos() {
    const addressedUtxos = this.utxos.map((utxo: RawUtxo): CardanoTypes.CardanoAddressedUtxo => {
      const addressing = this.getAddressing(utxo.receiver)

      return {
        addressing,
        txIndex: utxo.tx_index,
        txHash: utxo.tx_hash,
        amount: utxo.amount,
        receiver: utxo.receiver,
        utxoId: utxo.utxo_id,
        assets: utxo.assets,
      }
    })

    return Promise.resolve(addressedUtxos)
  }

  getDelegationStatus() {
    const certsForKey = this.transactionManager.perRewardAddressCertificates[this.rewardAddressHex]
    return Promise.resolve(getDelegationStatus(this.rewardAddressHex, certsForKey))
  }

  canGenerateNewReceiveAddress() {
    const lastUsedIndex = this.getLastUsedIndex(this.externalChain)
    // TODO: should use specific wallet config
    const maxIndex = lastUsedIndex + MAX_GENERATED_UNUSED
    if (this.state.lastGeneratedAddressIndex >= maxIndex) {
      return false
    }
    return this.numReceiveAddresses < this.externalAddresses.length
  }

  generateNewReceiveAddressIfNeeded() {
    /* new address is automatically generated when you use the latest unused */
    const lastGeneratedAddress = this.externalChain.addresses[this.state.lastGeneratedAddressIndex]
    if (!this.isUsedAddress(lastGeneratedAddress)) {
      return false
    }
    return this.generateNewReceiveAddress()
  }

  generateNewReceiveAddress() {
    if (!this.canGenerateNewReceiveAddress()) return false

    this.updateState({
      lastGeneratedAddressIndex: this.state.lastGeneratedAddressIndex + 1,
    })

    // note: don't await on purpose
    this.save()

    this.notify({type: 'addresses', addresses: this.receiveAddresses})

    return true
  }

  async getStakingInfo(): Promise<StakingInfo> {
    if (!this.rewardAddressHex) throw new Error('invalid wallet')

    const stakingStatus = await this.getDelegationStatus()
    if (!stakingStatus.isRegistered) return {status: 'not-registered'}
    if (!('poolKeyHash' in stakingStatus)) return {status: 'registered'}

    const accountStates = await this.fetchAccountState()
    const accountState = accountStates[this.rewardAddressHex]
    if (!accountState) throw new Error('Account state not found')

    const stakingUtxos = await this.getAllUtxosForKey()
    const amount = Quantities.sum([
      ...stakingUtxos.map((utxo) => utxo.amount as Quantity),
      accountState.remainingAmount as Quantity,
    ])

    return {
      status: 'staked',
      poolId: stakingStatus.poolKeyHash,
      amount,
      rewards: accountState.remainingAmount as Quantity,
    }
  }

  // =================== tx building =================== //

  async createUnsignedTx(receiver: string, tokens: SendTokenList, auxiliaryData?: Array<CardanoTypes.TxMetadata>) {
    const serverTime = await this.checkServerStatus()
      .then(({serverTime}) => serverTime ?? Date.now())
      .catch(() => Date.now())

    const {absoluteSlot} = this.networkInfo.getTime(serverTime)
    const absSlotNumber = new BigNumber(absoluteSlot)
    const changeAddr = await this.getAddressedChangeAddress()
    const addressedUtxos = await this.getAddressedUtxos()

    try {
      const unsignedTx = await Cardano.createUnsignedTx(
        absSlotNumber,
        addressedUtxos,
        receiver,
        changeAddr,
        tokens as any,
        CARDANO_HASKELL_CONFIG,
        primaryToken,
        {metadata: auxiliaryData},
      )

      return yoroiUnsignedTx({unsignedTx, networkConfig: CARDANO_HASKELL_SHELLEY_NETWORK, addressedUtxos})
    } catch (e) {
      if (e instanceof NotEnoughMoneyToSendError || e instanceof NoOutputsError) throw e
      Logger.error(`shelley::createUnsignedTx:: ${(e as Error).message}`, e)
      throw new CardanoError((e as Error).message)
    }
  }

  async signTx(unsignedTx: YoroiUnsignedTx, decryptedMasterKey: string) {
    const {stakingPrivateKey, accountPrivateKeyHex} = await deriveKeys(decryptedMasterKey)
    const stakingKeys =
      unsignedTx.staking.delegations ||
      unsignedTx.staking.registrations ||
      unsignedTx.staking.deregistrations ||
      unsignedTx.staking.withdrawals
        ? [stakingPrivateKey]
        : undefined

    const signedTx = await unsignedTx.unsignedTx.sign(
      BIP44_DERIVATION_LEVELS.ACCOUNT,
      accountPrivateKeyHex,
      new Set<string>(),
      stakingKeys,
    )

    return yoroiSignedTx({
      unsignedTx,
      signedTx,
    })
  }

  async createDelegationTx(poolId: string | undefined, delegatedAmount: BigNumber) {
    const serverTime = await this.checkServerStatus()
      .then(({serverTime}) => serverTime || Date.now())
      .catch(() => Date.now())

    const {absoluteSlot} = this.networkInfo.getTime(serverTime)
    const absSlotNumber = new BigNumber(absoluteSlot)
    const changeAddr = await this.getAddressedChangeAddress()
    const addressedUtxos = await this.getAddressedUtxos()
    const registrationStatus = (await this.getDelegationStatus()).isRegistered
    const stakingKey = await this.getStakingKey()
    const delegationType = registrationStatus ? RegistrationStatus.DelegateOnly : RegistrationStatus.RegisterAndDelegate
    const delegatedAmountMT = {
      values: [{identifier: '', amount: delegatedAmount, networkId: NETWORK_ID}],
      defaults: primaryToken,
    }

    const unsignedTx = await Cardano.createUnsignedDelegationTx(
      absSlotNumber,
      addressedUtxos,
      stakingKey,
      delegationType,
      poolId || null,
      changeAddr,
      delegatedAmountMT,
      primaryToken,
      {},
      CARDANO_HASKELL_CONFIG,
    )

    return yoroiUnsignedTx({
      unsignedTx,
      networkConfig: CARDANO_HASKELL_SHELLEY_NETWORK,
      addressedUtxos,
    })
  }

  async createVotingRegTx(pin: string) {
    Logger.debug('CardanoWallet::createVotingRegTx called')

    const bytes = await generatePrivateKeyForCatalyst()
      .then((key) => key.toRawKey())
      .then((key) => key.asBytes())

    const catalystKeyHex = Buffer.from(bytes).toString('hex')

    try {
      const serverTime = await this.checkServerStatus()
        .then(({serverTime}) => serverTime || Date.now())
        .catch(() => Date.now())

      const {absoluteSlot} = this.networkInfo.getTime(serverTime)
      const absSlotNumber = new BigNumber(absoluteSlot)
      const votingPublicKey = await Promise.resolve(Buffer.from(catalystKeyHex, 'hex'))
        .then((bytes) => CardanoMobile.PrivateKey.fromExtendedBytes(bytes))
        .then((key) => key.toPublic())
      const stakingPublicKey = await this.getStakingKey()
      const changeAddr = await this.getAddressedChangeAddress()
      const txOptions = {}
      const nonce = absSlotNumber.toNumber()

      const addressedUtxos = await this.getAddressedUtxos()

      const unsignedTx = await Cardano.createUnsignedVotingTx(
        absSlotNumber,
        primaryToken,
        votingPublicKey,
        STAKING_KEY_PATH,
        stakingPublicKey,
        addressedUtxos,
        changeAddr,
        CARDANO_HASKELL_CONFIG,
        txOptions,
        nonce,
        CHAIN_NETWORK_ID,
      )

      const votingRegistration: VotingRegistration = {
        votingPublicKey: await votingPublicKey.toBech32(),
        stakingPublicKey: await stakingPublicKey.toBech32(),
        rewardAddress: await this.getRewardAddress().then((address) => address.toBech32()),
        nonce,
      }

      const password = Buffer.from(pin.split('').map(Number))
      const catalystKeyEncrypted = await encryptWithPassword(password, bytes)

      return {
        votingKeyEncrypted: catalystKeyEncrypted,
        votingRegTx: await yoroiUnsignedTx({
          unsignedTx,
          networkConfig: CARDANO_HASKELL_SHELLEY_NETWORK,
          votingRegistration,
          addressedUtxos,
        }),
      }
    } catch (e) {
      if (e instanceof LocalizableError || e instanceof ExtendableError) throw e
      Logger.error(`shelley::createVotingRegTx:: ${(e as Error).message}`, e)
      throw new CardanoError((e as Error).message)
    }
  }

  async createWithdrawalTx(shouldDeregister: boolean): Promise<YoroiUnsignedTx> {
    const serverTime = await this.checkServerStatus()
      .then(({serverTime}) => serverTime || Date.now())
      .catch(() => Date.now())

    const {absoluteSlot} = this.networkInfo.getTime(serverTime)
    const absSlotNumber = new BigNumber(absoluteSlot)
    const changeAddr = await this.getAddressedChangeAddress()
    const addressedUtxos = await this.getAddressedUtxos()
    const accountState = await api.getAccountState({addresses: [this.rewardAddressHex]}, BACKEND)

    const withdrawalTx = await Cardano.createUnsignedWithdrawalTx(
      accountState,
      primaryToken,
      absSlotNumber,
      addressedUtxos,
      [
        {
          addressing: REWARD_ADDRESS_ADDRESSING,
          rewardAddress: this.rewardAddressHex,
          shouldDeregister,
        },
      ],
      changeAddr,
      CARDANO_HASKELL_CONFIG,
      {metadata: undefined},
    )

    return yoroiUnsignedTx({
      unsignedTx: withdrawalTx,
      networkConfig: CARDANO_HASKELL_SHELLEY_NETWORK,
      addressedUtxos,
    })
  }

  async signTxWithLedger(unsignedTx: YoroiUnsignedTx, useUSB: boolean): Promise<YoroiSignedTx> {
    if (!this.hwDeviceInfo) throw new Error('Invalid wallet state')

    const ledgerPayload = await Cardano.buildLedgerPayload(
      unsignedTx.unsignedTx,
      CHAIN_NETWORK_ID,
      BYRON_BASE_CONFIG.PROTOCOL_MAGIC, // Byron era
      STAKING_KEY_PATH,
    )

    const signedLedgerTx = await signTxWithLedger(ledgerPayload, this.hwDeviceInfo, useUSB)
    const signedTx = await Cardano.buildLedgerSignedTx(
      unsignedTx.unsignedTx,
      signedLedgerTx,
      CIP1852,
      this.publicKeyHex,
    )

    return yoroiSignedTx({
      unsignedTx,
      signedTx,
    })
  }

  // =================== backend API =================== //

  async checkServerStatus() {
    return api.checkServerStatus(BACKEND)
  }

  async submitTransaction(signedTx: string) {
    const response: any = await api.submitTransaction(signedTx, BACKEND)
    Logger.info(response)
    return response as any
  }

  private async syncUtxos() {
    const addresses = [...this.internalAddresses, ...this.externalAddresses]

    await this.utxoManager.sync(addresses)

    this._utxos = await this.utxoManager.getCachedUtxos()

    // notifying always -> sync from lib need to flag if something has changed
    this.notify({type: 'utxos', utxos: this.utxos})
  }

  async fetchAccountState(): Promise<AccountStateResponse> {
    return api.bulkGetAccountState([this.rewardAddressHex], BACKEND)
  }

  async fetchPoolInfo(request: PoolInfoRequest) {
    return api.getPoolInfo(request, BACKEND)
  }

  fetchTokenInfo(tokenId: string) {
    return tokenId === '' || tokenId === 'ADA'
      ? Promise.resolve(primaryTokenInfo)
      : api.getTokenInfo(tokenId, `${TOKEN_INFO_SERVICE}/metadata`)
  }

  async fetchFundInfo(): Promise<FundInfoResponse> {
    return api.getFundInfo(BACKEND, IS_MAINNET)
  }

  async fetchTxStatus(request: TxStatusRequest): Promise<TxStatusResponse> {
    return api.fetchTxStatus(request, BACKEND)
  }

  async fetchTipStatus(): Promise<TipStatusResponse> {
    return api.getTipStatus(BACKEND)
  }

  async fetchCurrentPrice(symbol: CurrencySymbol): Promise<number> {
    return api.fetchCurrentPrice(symbol, BACKEND)
  }

  private state: WalletState = {
    lastGeneratedAddressIndex: 0,
  }

  private isInitialized = false

  private _doFullSyncMutex: any = {name: 'doFullSyncMutex', lock: null}

  private subscriptions: Array<WalletSubscription> = []

  private _onTxHistoryUpdateSubscriptions: Array<(Wallet) => void> = []

  private _isUsedAddressIndexSelector = defaultMemoize((perAddressTxs) =>
    _.mapValues(perAddressTxs, (txs) => {
      assert.assert(!!txs, 'perAddressTxs cointains false-ish value')
      return txs.length > 0
    }),
  )

  // =================== getters =================== //

  get internalAddresses() {
    return this.internalChain.addresses
  }

  get externalAddresses() {
    return this.externalChain.addresses
  }

  get isUsedAddressIndex() {
    return this._isUsedAddressIndexSelector(this.transactionManager.perAddressTxs)
  }

  get numReceiveAddresses() {
    return this.state.lastGeneratedAddressIndex + 1
  }

  get transactions() {
    const memos = this.memosManager.getMemos()
    return _.mapValues(this.transactionManager.transactions, (tx: Transaction) => {
      return processTxHistoryData(
        tx,
        this.rewardAddressHex != null
          ? [...this.internalAddresses, ...this.externalAddresses, ...[this.rewardAddressHex]]
          : [...this.internalAddresses, ...this.externalAddresses],
        this.confirmationCounts[tx.id] || 0,
        NETWORK_ID,
        memos[tx.id] ?? null,
      )
    })
  }

  get confirmationCounts() {
    return this.transactionManager.confirmationCounts
  }

  // ============ security & key management ============ //

  async getDecryptedRootKey(password: string) {
    return this.encryptedStorage.rootKey.read(password)
  }

  async enableEasyConfirmation(rootKey: string) {
    await Keychain.setWalletKey(this.id, rootKey)
    this.isEasyConfirmationEnabled = true

    this.notify({type: 'easy-confirmation', enabled: this.isEasyConfirmationEnabled})
  }

  async disableEasyConfirmation() {
    await Keychain.removeWalletKey(this.id)
    this.isEasyConfirmationEnabled = false

    this.notify({type: 'easy-confirmation', enabled: this.isEasyConfirmationEnabled})
  }

  async changePassword(oldPassword: string, newPassword: string) {
    if (!_.isEmpty(validatePassword(newPassword, newPassword))) throw new Error('New password is not valid')

    const rootKey = await this.encryptedStorage.rootKey.read(oldPassword)
    return this.encryptedStorage.rootKey.write(rootKey, newPassword)
  }

  // =================== subscriptions =================== //

  // needs to be bound
  private notify = (event: WalletEvent) => {
    this.subscriptions.forEach((handler) => handler(event))
  }

  subscribe(subscription: WalletSubscription) {
    this.subscriptions.push(subscription)

    return () => {
      this.subscriptions = this.subscriptions.filter((sub) => sub !== subscription)
    }
  }

  private notifyOnTxHistoryUpdate = () => {
    this._onTxHistoryUpdateSubscriptions.forEach((handler) => handler(this))
  }

  subscribeOnTxHistoryUpdate(subscription: () => void) {
    this._onTxHistoryUpdateSubscriptions.push(subscription)

    return () => {
      this._onTxHistoryUpdateSubscriptions = this._onTxHistoryUpdateSubscriptions.filter((sub) => sub !== subscription)
    }
  }

  private setupSubscriptions() {
    this.transactionManager.subscribe(() => this.notify({type: 'transactions', transactions: this.transactions}))
    this.transactionManager.subscribe(this.notifyOnTxHistoryUpdate)
    this.internalChain.addSubscriberToNewAddresses(() =>
      this.notify({type: 'addresses', addresses: this.internalAddresses}),
    )
    this.externalChain.addSubscriberToNewAddresses(() =>
      this.notify({type: 'addresses', addresses: this.externalAddresses}),
    )
  }

  // =================== sync =================== //

  async tryDoFullSync() {
    try {
      return await nonblockingSynchronize(this._doFullSyncMutex, () => this._doFullSync())
    } catch (error) {
      if (!(error instanceof IsLockedError)) {
        throw error
      }
    }
  }

  private async doFullSync() {
    return synchronize(this._doFullSyncMutex, () => this._doFullSync())
  }

  private async _doFullSync() {
    assert.assert(this.isInitialized, 'doFullSync: isInitialized')
    Logger.info('Discovery done, now syncing transactions')

    await this.discoverAddresses()

    await Promise.all([this.syncUtxos(), this.transactionManager.doSync(this.getAddressesInBlocks(), BACKEND)])

    this.updateLastGeneratedAddressIndex()
  }

  private getAddressesInBlocks() {
    const internalAddresses = this.internalChain.getBlocks()
    const externalAddresses = this.externalChain.getBlocks()

    if (this.rewardAddressHex != null) return [...internalAddresses, ...externalAddresses, [this.rewardAddressHex]]

    return [...internalAddresses, ...externalAddresses]
  }

  private async discoverAddresses() {
    // last chunk gap limit check
    const filterFn = (addrs) => api.filterUsedAddresses(addrs, BACKEND)
    await Promise.all([this.internalChain.sync(filterFn), this.externalChain.sync(filterFn)])
  }

  private isUsedAddress(address: string) {
    const perAddressTxs = this.transactionManager.perAddressTxs
    return !!perAddressTxs[address] && perAddressTxs[address].length > 0
  }

  private getLastUsedIndex(chain: AddressChain): number {
    for (let i = chain.size() - 1; i >= 0; i--) {
      if (this.isUsedAddress(chain.addresses[i])) {
        return i
      }
    }
    return -1
  }

  private updateLastGeneratedAddressIndex = () => {
    const lastUsedIndex = this.getLastUsedIndex(this.externalChain)
    if (lastUsedIndex > this.state.lastGeneratedAddressIndex) {
      this.state.lastGeneratedAddressIndex = lastUsedIndex
    }
  }

  // ========== UI state ============= //

  private updateState(update: Partial<WalletState>) {
    Logger.debug('Wallet::updateState', update)

    this.state = {
      ...this.state,
      ...update,
    }

    this.notify({type: 'state', state: this.state})
  }

  // ========== persistence ============= //

  private toJSON(): Omit<ShelleyWalletJSON, 'networkId' | 'walletImplementationId'> {
    return {
      lastGeneratedAddressIndex: this.state.lastGeneratedAddressIndex,
      publicKeyHex: this.publicKeyHex,
      version: this.version,
      internalChain: this.internalChain.toJSON(),
      externalChain: this.externalChain.toJSON(),
      isHW: this.isHW,
      hwDeviceInfo: this.hwDeviceInfo,
      isReadOnly: this.isReadOnly,
      isEasyConfirmationEnabled: this.isEasyConfirmationEnabled,
    }
  }
}

const makeKeys = async ({mnemonic}: {mnemonic: string}) => {
  const rootKeyPtr = await generateWalletRootKey(mnemonic)
  const rootKey: string = Buffer.from(await rootKeyPtr.asBytes()).toString('hex')

  const purpose = CIP1852
  const accountPubKeyHex = await rootKeyPtr
    .derive(purpose)
    .then((key) => key.derive(COIN_TYPE))
    .then((key) => key.derive(ACCOUNT_INDEX + HARD_DERIVATION_START))
    .then((accountKey) => accountKey.toPublic())
    .then((accountPubKey) => accountPubKey.asBytes())
    .then((bytes) => Buffer.from(bytes).toString('hex'))

  return {
    rootKey,
    accountPubKeyHex,
  }
}

const addressChains = {
  create: async ({accountPubKeyHex}: {accountPubKeyHex: string}) => {
    const rest = [DISCOVERY_BLOCK_SIZE, DISCOVERY_GAP_SIZE]

    const internalChain = new AddressChain(
      new AddressGenerator(accountPubKeyHex, 'Internal', WALLET_IMPLEMENTATION_ID, NETWORK_ID),
      ...rest,
    )

    const externalChain = new AddressChain(
      new AddressGenerator(accountPubKeyHex, 'External', WALLET_IMPLEMENTATION_ID, NETWORK_ID),
      ...rest,
    )

    // Create at least one address in each block
    await internalChain.initialize()
    await externalChain.initialize()

    return {internalChain, externalChain}
  },

  restore: ({data}: {data: ShelleyWalletJSON}) => {
    return {
      internalChain: AddressChain.fromJSON(data.internalChain, NETWORK_ID),
      externalChain: AddressChain.fromJSON(data.externalChain, NETWORK_ID),
    }
  },
}

const parseWalletJSON = (data: unknown) => {
  const parsed = parseSafe(data)
  return isWalletJSON(parsed) ? parsed : undefined
}

const isWalletJSON = (data: unknown): data is ShelleyWalletJSON => {
  const candidate = data as ShelleyWalletJSON
  return !!candidate && typeof candidate === 'object' && keys.every((key) => key in candidate)
}

const keys: Array<keyof ShelleyWalletJSON> = [
  'publicKeyHex',
  'internalChain',
  'externalChain',
  'isEasyConfirmationEnabled',
  'lastGeneratedAddressIndex',
]

const encryptAndSaveRootKey = (wallet: YoroiWallet, rootKey: string, password: string) =>
  wallet.encryptedStorage.rootKey.write(rootKey, password)

type WalletState = {
  lastGeneratedAddressIndex: number
}

type ShelleyWalletJSON = {
  version: string

  isHW: boolean
  hwDeviceInfo: null | HWDeviceInfo
  isReadOnly: boolean
  isEasyConfirmationEnabled: boolean

  publicKeyHex?: string

  lastGeneratedAddressIndex: number
  internalChain: AddressChainJSON
  externalChain: AddressChainJSON
}

type VotingRegistration = {
  votingPublicKey: string
  stakingPublicKey: string
  rewardAddress: string
  nonce: number
}