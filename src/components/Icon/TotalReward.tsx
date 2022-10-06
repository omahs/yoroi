import React from 'react'
import Svg, {Circle, G, Path} from 'react-native-svg'

type Props = {
  width: number
  height: number
}

export const TotalReward = ({width, height}: Props) => (
  <Svg viewBox="0 0 44 44" {...{width, height}}>
    <G id="icon/total-rewards.inline" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
      <G id="icon/bg-for-icon" fill="#F0F3F5">
        <Circle id="Oval-Copy-4" cx="22" cy="22" r="22" />
      </G>
      <G id="icon" transform="translate(7.333333, 7.333333)">
        <Path
          d="M16.2199168,13.8040549 L16.2536849,13.8102487 C16.2855509,13.8222842 16.3102378,13.8507879 16.314492,13.8862495 L16.3114445,13.9236783 L15.1137436,18.2634483 L15.0929851,18.3022733 C15.0561032,18.3436867 14.9876705,18.3436867 14.9508643,18.3022733 L14.9301768,18.2634483 L13.7323055,13.9236783 L13.7296391,13.8836577 C13.7371733,13.8333926 13.7858284,13.7978405 13.8367687,13.8049635 L13.8747956,13.8187443 L14.0216188,13.9007191 C14.2618923,14.0231833 14.5272277,14.1031841 14.8082825,14.1302858 L15.021875,14.1405305 L15.2002545,14.1333973 C15.5531901,14.1050531 15.8821724,13.9933747 16.1689544,13.8187443 C16.1856578,13.8085235 16.203043,13.8040549 16.2199168,13.8040549 Z M15.0218955,10.4729167 L15.1483901,10.4791574 C15.7700315,10.5408134 16.2650837,11.0522238 16.3283278,11.6964845 L16.3351596,11.8364583 L16.329149,11.9677691 C16.2697664,12.6130936 15.7772131,13.1272224 15.1567081,13.1929048 L15.0218955,13.2 L14.8954266,13.1937576 C14.229502,13.1276804 13.7086315,12.5451792 13.7086315,11.8364583 C13.7086315,11.083272 14.2966454,10.4729167 15.0218955,10.4729167 Z M13.067102,10.6411436 L13.1038326,10.6494544 C13.1372972,10.6654078 13.1594625,10.7022848 13.1568189,10.7420457 L13.1454053,10.7820997 L13.0693842,10.94251 C12.9761333,11.1611691 12.9158965,11.3983874 12.8955318,11.6474989 L12.8878414,11.8364583 L12.8951594,12.0211172 C12.9145452,12.2646735 12.9719306,12.497069 13.0611383,12.7118395 L13.1339143,12.8695116 L13.1446598,12.9069072 C13.1487911,12.9564776 13.1142906,13.0019953 13.0669857,13.0087656 L13.0295098,13.0060362 L9.23401249,11.9189526 L9.19659814,11.898146 C9.15668951,11.861242 9.15668951,11.792926 9.19659814,11.756022 L9.23401249,11.7352154 L13.0416575,10.6447229 C13.0503578,10.6423367 13.0588941,10.6411436 13.067102,10.6411436 Z M16.9766891,10.6411436 L16.9892266,10.6420384 L17.0021336,10.6447229 L20.8096144,11.7352154 L20.8470971,11.756022 C20.8870787,11.792926 20.8870787,11.861242 20.8470971,11.898146 L20.8096144,11.9189526 L17.0141171,13.0060362 L16.9766997,13.0087656 C16.9294465,13.0019953 16.8949125,12.9564776 16.8991685,12.9069072 L16.9100409,12.8695116 L16.9827477,12.7118395 C17.0718794,12.497069 17.1292496,12.2646735 17.1486324,12.0211172 L17.1559496,11.8364583 L17.1482593,11.6474989 C17.1228034,11.3361096 17.0350472,11.0433032 16.8983857,10.7820997 C16.8639125,10.715968 16.9108617,10.6411436 16.9766891,10.6411436 Z M15.021875,5.5 C15.0482368,5.5 15.0745229,5.51037226 15.0929559,5.53106632 L15.1137436,5.56984243 L16.3854167,10.1773986 L16.3780876,10.1773986 L16.2330848,10.073844 C15.934637,9.87807091 15.5867661,9.75169577 15.211619,9.71958396 L15.021875,9.71149845 L14.832124,9.71958396 C14.456951,9.75169577 14.1089942,9.87807091 13.8106162,10.073844 L13.6656624,10.1773986 L13.6583333,10.1773986 L14.9301768,5.56984243 L14.9508446,5.53106632 C14.9692271,5.51037226 14.9955132,5.5 15.021875,5.5 Z"
          id="Combined-Shape"
          fill="#3154CB"
        />
        <Path
          d="M22.5396046,17.8093791 L24.6690125,22.0671727 C24.7566102,22.2421175 24.7472517,22.4496954 24.6443127,22.6160639 C24.5586252,22.7547488 24.4181171,22.8482525 24.2604324,22.8755681 L24.1640616,22.8838468 L21.0084306,22.8838468 L19.0466825,25.4409418 C18.9399208,25.5832062 18.7724238,25.6666667 18.5951218,25.6666667 C18.4065832,25.6666667 18.2385107,25.5742038 18.1357548,25.4305893 L18.0900275,25.3547107 L16.0708401,21.3191237 C16.4674064,21.2794901 16.8568133,21.2155538 17.2375495,21.1288259 L18.62972,23.9100139 L18.7741811,23.9230431 L20.2315766,21.9810571 C20.3169732,21.8673799 20.4411579,21.7911236 20.5784493,21.7650815 L20.6834741,21.7551651 L23.1123538,21.7551651 L23.1886157,21.631745 L21.7230195,18.7015267 C22.0135358,18.4217876 22.2863465,18.1237895 22.5396046,17.8093791 Z M7.68781923,17.8153098 C7.94089751,18.128986 8.21345108,18.4262934 8.50364241,18.7053944 L7.03994863,21.6319077 L7.11620729,21.7553342 L9.54525615,21.7553342 C9.68748847,21.7553342 9.82302716,21.8088486 9.92613112,21.9030067 L9.99697537,21.9810448 L11.4545521,23.9230469 L11.5990117,23.9100112 L12.9891055,21.129739 C13.3703062,21.2163985 13.7601905,21.2802127 14.1572426,21.3196658 L12.1387164,25.3546836 C12.0454141,25.5410187 11.853537,25.6666667 11.6336086,25.6666667 C11.4916917,25.6666667 11.3561831,25.6132883 11.2528815,25.519047 L11.1818472,25.4408999 L9.28850227,22.9179359 L6.0646688,22.8838468 C5.86902042,22.8838468 5.68722421,22.7824918 5.58424838,22.6160639 C5.49860018,22.4774425 5.47782509,22.310155 5.52389509,22.1569862 L5.55957429,22.0671215 Z M15.1143652,3.66666667 C19.6479825,3.66666667 23.336468,7.3529665 23.336468,11.8838468 C23.336468,13.4343561 22.9036004,14.9221464 22.1018412,16.2103678 L21.9244127,16.4833107 C20.4386929,18.6584395 17.9414249,20.0834776 15.1113214,20.0834776 C13.0738829,20.0834776 11.2089465,19.3449091 9.7696369,18.1208969 L9.81273191,18.1594292 C9.75218769,18.1082514 9.69233912,18.0561725 9.63320686,18.0032061 L9.63354012,18.0025852 C9.48213536,17.8678869 9.33573933,17.7267745 9.1943635,17.5800947 C8.86706763,17.2455642 8.56991221,16.88302 8.3047799,16.4967746 L8.30448558,16.483647 C7.38922908,15.1346156 6.8922623,13.5451955 6.8922623,11.8838468 C6.8922623,7.3529665 10.5807479,3.66666667 15.1143652,3.66666667 Z M15.1143652,4.79517926 C11.2033481,4.79517926 8.02154514,7.97509678 8.02154514,11.8838468 C8.02154514,15.7925968 11.2033481,18.9725143 15.1143652,18.9725143 C19.0253822,18.9725143 22.2071852,15.7925968 22.2071852,11.8838468 C22.2071852,7.97509678 19.0253822,4.79517926 15.1143652,4.79517926 Z"
          id="Combined-Shape"
          fill="#3154CB"
        />
        <Path
          d="M17.6165588,14.2541311 L17.687398,14.296837 L18.9420316,15.2152832 C19.1462829,15.3648039 19.1906508,15.6515929 19.04113,15.8558442 C18.9082226,16.0374009 18.6668565,16.0926299 18.4714082,15.9976484 L18.400569,15.9549425 L17.1459353,15.0364963 C16.941684,14.8869755 16.8973162,14.6001866 17.046837,14.3959353 C17.1631309,14.2370732 17.3624636,14.1749307 17.5414148,14.2255075 L17.6165588,14.2541311 Z M12.8500418,14.3793578 C12.9829492,14.5609145 12.9626606,14.8076861 12.813059,14.9652961 L12.7509435,15.0199188 L11.4963099,15.938365 C11.2920586,16.0878858 11.0052696,16.0435179 10.8557488,15.8392666 C10.7228415,15.6577099 10.7431301,15.4109383 10.8927317,15.2533284 L10.9548472,15.1987056 L12.2094808,14.2802595 C12.4137321,14.1307387 12.700521,14.1751065 12.8500418,14.3793578 Z M19.04113,7.97926866 C19.1740373,8.16082536 19.1537488,8.40759699 19.0041471,8.56520692 L18.9420316,8.61982967 L17.687398,9.53827583 C17.4831467,9.68779662 17.1963578,9.64342879 17.046837,9.4391775 C16.9139296,9.2576208 16.9342182,9.01084917 17.0838198,8.85323924 L17.1459353,8.79861649 L18.400569,7.88017033 C18.6048202,7.73064954 18.8916092,7.77501737 19.04113,7.97926866 Z M11.4254707,7.82088696 L11.4963099,7.86359281 L12.7509435,8.78203897 C12.9551948,8.93155976 12.9995626,9.21834869 12.8500418,9.42259998 C12.7171345,9.60415668 12.4757683,9.65938572 12.28032,9.56440416 L12.2094808,9.52169831 L10.9548472,8.60325215 C10.7505959,8.45373136 10.7062281,8.16694243 10.8557488,7.96269114 C10.9720428,7.80382903 11.1713755,7.74168654 11.3503267,7.79226335 L11.4254707,7.82088696 Z"
          id="Combined-Shape"
          fill="#F14D78"
          fill-rule="nonzero"
        />
      </G>
    </G>
  </Svg>
)
