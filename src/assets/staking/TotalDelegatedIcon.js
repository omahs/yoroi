// @flow
/* eslint-disable max-len */

import React from 'react'
import Svg, {G, Path, Circle} from 'react-native-svg'

type Props = {
  width: number,
  height: number,
}

const TotalDelegatedIcon = ({width, height}: Props) => (
  <Svg
    version="1.1"
    viewBox="0 0 44 44"
    xmlns="http://www.w3.org/2000/svg"
    {...{width, height}}
  >
    <G
      id="icon/total-delegated.inline"
      stroke="none"
      stroke-width="1"
      fill="none"
      fill-rule="evenodd"
    >
      <G id="icon/bg-for-icon" fill="#F0F3F5">
        <Circle id="Oval-Copy-4" cx="22" cy="22" r="22" />
      </G>
      <G id="icon" transform="translate(10.000000, 9.000000)">
        <Path
          d="M5.08207106,19.3846409 C6.70608254,21.4105124 9.20155497,22.7076923 12,22.7076923 C14.798445,22.7076923 17.2939175,21.4105124 18.9179289,19.3846409 L20.5115262,19.3849683 C18.6997667,22.1634256 15.5643608,24 12,24 C8.43563919,24 5.30023332,22.1634256 3.48847384,19.3849683 L5.08207106,19.3846409 Z M21.0465496,9.23049463 L19.565786,9.23006169 C18.6495078,7.73148528 17.3004995,6.5262833 15.6925325,5.7882271 L15.6921488,4.38444316 C18.0142533,5.29124788 19.920671,7.02821588 21.0465496,9.23049463 Z M8.30785117,4.38444316 L8.30722368,5.788339 C6.69936415,6.52640513 5.35044594,7.73156102 4.43421403,9.23006169 L2.9534504,9.23049463 C4.07932898,7.02821588 5.98574675,5.29124788 8.30785117,4.38444316 Z"
          id="Combined-Shape"
          fill="#F14D78"
        />
        <G id="user" transform="translate(0.000000, 10.153846)" fill="#3154CB">
          <Circle id="Oval" cx="3.52301752" cy="2.13840214" r="2.13840214" />
          <Path
            d="M0.175306815,7.4847664 C0.677290066,5.57184521 1.82814142,4.61538462 3.62786087,4.61538462 C5.41349688,4.61538462 6.62177616,5.5569345 7.2526987,7.44003427 C7.37554691,7.80661152 7.1779378,8.20335546 6.81135197,8.32617808 C6.73966658,8.35019589 6.66456386,8.36244272 6.58896194,8.36244272 L0.8523828,8.36244272 C0.465783173,8.36244327 0.152382254,8.04904235 0.152382254,7.66244272 C0.152382254,7.60247986 0.160086855,7.54276551 0.175306815,7.4847664 Z"
            id="Path-3"
          />
        </G>
        <G
          id="user-copy"
          transform="translate(16.615385, 10.153846)"
          fill="#3154CB"
        >
          <Circle id="Oval" cx="3.52301752" cy="2.13840214" r="2.13840214" />
          <Path
            d="M0.175306815,7.4847664 C0.677290066,5.57184521 1.82814142,4.61538462 3.62786087,4.61538462 C5.41349688,4.61538462 6.62177616,5.5569345 7.2526987,7.44003427 C7.37554691,7.80661152 7.1779378,8.20335546 6.81135197,8.32617808 C6.73966658,8.35019589 6.66456386,8.36244272 6.58896194,8.36244272 L0.8523828,8.36244272 C0.465783173,8.36244327 0.152382254,8.04904235 0.152382254,7.66244272 C0.152382254,7.60247986 0.160086855,7.54276551 0.175306815,7.4847664 Z"
            id="Path-3"
          />
        </G>
        <G
          id="user-copy-2"
          transform="translate(8.307692, 0.000000)"
          fill="#3154CB"
        >
          <Circle id="Oval" cx="3.52301752" cy="2.13840214" r="2.13840214" />
          <Path
            d="M0.175306815,7.4847664 C0.677290066,5.57184521 1.82814142,4.61538462 3.62786087,4.61538462 C5.41349688,4.61538462 6.62177616,5.5569345 7.2526987,7.44003427 C7.37554691,7.80661152 7.1779378,8.20335546 6.81135197,8.32617808 C6.73966658,8.35019589 6.66456386,8.36244272 6.58896194,8.36244272 L0.8523828,8.36244272 C0.465783173,8.36244327 0.152382254,8.04904235 0.152382254,7.66244272 C0.152382254,7.60247986 0.160086855,7.54276551 0.175306815,7.4847664 Z"
            id="Path-3"
          />
        </G>
      </G>
    </G>
  </Svg>
)

export default TotalDelegatedIcon
